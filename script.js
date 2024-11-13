// Importing necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"; 
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6Iu47dOKnGQ5ashwwWbOs51vlYttiLiQ",
  authDomain: "electric-vehicle-recharge-1377.firebaseapp.com",
  databaseURL: "https://electric-vehicle-recharge-1377-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "electric-vehicle-recharge-1377",
  storageBucket: "electric-vehicle-recharge-1377.appspot.com",
  messagingSenderId: "296941284745",
  appId: "1:296941284745:web:0c0687d9d2cba4d37b4558",
  measurementId: "G-KQFW8PZCXJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

//
// Authentication functions
//

if (window.location.pathname.endsWith("index.html/")) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginButton = document.querySelector('.login-btn');

        if (loginButton) {
            loginButton.addEventListener('click', async (event) => {
                event.preventDefault(); // Prevent default form submission

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                // Check for empty inputs
                if (!email || !password) {
                    alert("Please enter both email and password.");
                    return;
                }

                try {
                    // Authenticate user
                    const auth = getAuth();
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    const uid = user.uid;

                    // Fetch user document
                    const userDoc = await getDoc(doc(db, "users", uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log("User data:", userData);

                        // Redirect based on user role
                        if (userData.role === "admin") {
                            window.location.href = "admindashboard.html";
                        } else {
                            window.location.href = "userpage.html";
                        }
                    } else {
                        console.error("No such user document!");
                        alert("User data not found. Redirecting to home.");
                        window.location.href = "userpage.html";
                    }
                } catch (error) {
                    console.error("Error during login:", error);
                    alert("Login failed. Please check your credentials.");
                }
            });
        } else {
            console.error("Login button not found!");
        }
    });
}


//
// Registration Section
//

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const name = registerForm[0].value.trim();
        const email = registerForm[1].value.trim();
        const password = registerForm[2].value.trim();
        const role = registerForm[3].value.trim();
        const adminCode = registerForm[4]?.value.trim();

        // Basic validation
        if (!name || !email || !password || !role) {
            alert("Please fill in all fields.");
            return;
        }

        // Admin role validation
        if (role === "admin" && adminCode !== "1111") {
            alert("Invalid admin code. Registration failed.");
            return; // Prevent registration
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Store user info in Firestore
            await setDoc(doc(db, 'users', uid), { // Use the user's UID as the document ID
                name: name,
                email: email,
                role: role,
            });

            alert("Registration successful");
            window.location.href = "index.html"; // Redirect to login page after registration
        } catch (error) {
            alert(`Registration error: ${error.message}`); // Show specific error message
        }
    });


        // Admin Code
        const roleSelect = document.getElementById("role");
        const adminCodeContainer = document.getElementById("adminCodeContainer");

        roleSelect.addEventListener("change", () => {
            if (roleSelect.value === "admin") {
                adminCodeContainer.style.display = "block"; // Show admin code input
            } else {
                adminCodeContainer.style.display = "none"; // Hide admin code input
                document.getElementById("adminCode").value = ""; // Clear the admin code input
            }
        });
}


//
//Search nearby stations
//


if (window.location.pathname.endsWith('userpage.html')) {
    // OpenCage API key
    const API_KEY = '0a86107f48354f73b18b7757eab7e501';

    // Function to get latitude and longitude from OpenCage API
    async function getCoordinates(location) {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${API_KEY}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return {
                lat: data.results[0].geometry.lat,
                lng: data.results[0].geometry.lng
            };
        } else {
            throw new Error('Location not found');
        }
    }

    // Function to fetch bunk data from Firestore
    async function getBunks() {
        const bunkCollection = collection(db, 'map'); // Get a reference to the 'map' collection
        const snapshot = await getDocs(bunkCollection); // Fetch documents from the collection
        const bunks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            bunks.push({
                bunkName: data.bunkName,
                latitude: data.latitude,
                longitude: data.longitude
            });
        });
        return bunks;
    }

    // Function to calculate distance between two coordinates
    function getDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    // Function to search for the nearest bunk
    async function findNearestBunk() {
        const locationInput = document.getElementById('stationSearch').value;
        try {
            const { lat, lng } = await getCoordinates(locationInput);
            const bunks = await getBunks();
            
            let nearestBunk = null;
            let minDistance = Infinity;

            bunks.forEach(bunk => {
                const distance = getDistance(lat, lng, bunk.latitude, bunk.longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestBunk = bunk;
                }
            });

            // Display the nearest bunk
            if (nearestBunk) {
                alert(`Nearest Bunk: ${nearestBunk.bunkName}, Distance: ${minDistance.toFixed(2)} km`);
            } else {
                alert('No bunks found');
            }
        } catch (error) {
            console.error(error);
            alert('Error finding the nearest bunk: ' + error.message);
        }
    }

    // Event listener for the search bar
    document.getElementById('stationSearch').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            findNearestBunk();
        }
    });
}


//
//My Bookings
//


if (window.location.pathname.includes("userpage.html")) {
    // Function to fetch the current user's bookings
    async function fetchUserBookings() {
        // Get the current authenticated user
        const user = auth.currentUser;
        
        if (!user) {
            alert("You are not currently logged in.");
            return;
        }

        const userId = user.uid;

        // Reference to the bookings collection
        const bookingsRef = collection(db, "bookings");

        try {
            // Fetch the document with userId as the document ID
            const bookingDoc = await getDoc(doc(bookingsRef, userId));

            if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();

                document.getElementById("popupBunkName").textContent = bookingData.bunkName;
                document.getElementById("popupSlotNumber").textContent = bookingData.slotNumber;

                // Fetch location and contact info from the 'bunk' collection
                const bunkDoc = await getDoc(doc(db, "bunk", bookingData.bunkName));
                if (bunkDoc.exists()) {
                    const bunkData = bunkDoc.data();
                    document.getElementById("popupLocation").textContent = bunkData.location || "N/A";
                    document.getElementById("popupContact").textContent = bunkData.contact || "N/A";
                }

                document.getElementById("bookingInfoPopup").classList.remove("hidden");

            } else {
                alert("You don't have any bookings.");
            }
        } catch (error) {
            console.error("Error fetching booking data:", error);
            alert("Error retrieving booking information.");
        }
    }

    // Event listener for "My Bookings" button
    document.querySelector("#myBookingsButton").addEventListener("click", fetchUserBookings);

    // Event listener to close the popup
    document.getElementById("closePopupBtn").addEventListener("click", () => {
        document.getElementById("bookingInfoPopup").classList.add("hidden");
    });
}


//
// Available Station
//


// Function to list available stations based on slot availability
async function listAvailableStations() {
    const stationsContainer = document.getElementById("stationsContainer");
    if (!stationsContainer) return; // Exit if stationsContainer is not found (i.e., not on userpage.html)

    stationsContainer.innerHTML = "<p>Loading available stations...</p>";

    try {
        const availableSlotsQuery = query(collection(db, "slot"), where("status", "==", "available"));
        const slotSnapshot = await getDocs(availableSlotsQuery);

        // Clear the loading message after fetching
        stationsContainer.innerHTML = ""; 

        // Track displayed bunks to avoid duplicates
        const displayedBunks = new Set();

        // Loop through each available slot
        for (const slotDoc of slotSnapshot.docs) {
            const slotData = slotDoc.data();
            const bunkRef = doc(db, "bunk", slotData.bunkName);
            const bunkSnapshot = await getDoc(bunkRef);

            // Ensure bunk document exists and hasn't been displayed yet
            if (bunkSnapshot.exists() && !displayedBunks.has(slotData.bunkName)) {
                const bunkData = bunkSnapshot.data();
                displayedBunks.add(slotData.bunkName); // Track displayed bunk

                // Create a box for each available station
                const stationBox = document.createElement("div");
                stationBox.classList.add("station-box");
                stationBox.innerHTML = `
                    <p><strong>Bunk Name:</strong> ${bunkData.bunkName}</p>
                    <p><strong>Charging Type:</strong> ${bunkData.chargingType || "N/A"}</p>
                `;
                stationsContainer.appendChild(stationBox);
            }
        }

        // If no available stations found, display a message
        if (displayedBunks.size === 0) {
            stationsContainer.innerHTML = "<p>No available stations found.</p>";
        }
    } catch (error) {
        console.error("Error fetching available stations:", error);
        stationsContainer.innerHTML = "<p>Error loading available stations. Please try again later.</p>";
    }
}

// Call function when required to populate available stations
listAvailableStations();


//
//  Map
//


document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById('map');
    
    if (mapElement) {
        
        // Initialize the map
        const map = L.map('map').setView([12.9716, 77.5946], 13); // Center map on Bangalore

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Function to add markers for available stations
        function addStationMarker(lat, lng, name) {
            L.marker([lat, lng]).addTo(map)
                .bindPopup(`<b>${name}</b>`)
                .openPopup();
        }

        // Fetch stations from Firestore collection "map"
        async function loadStations() {
            try {
                const stationsQuery = query(collection(db, "map")); // Fetch all documents in the "map" collection
                const snapshot = await getDocs(stationsQuery);

                // Iterate over each document in the snapshot
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const { bunkName, latitude, longitude } = data; // Extract fields

                    // Add a marker for each station
                    addStationMarker(latitude, longitude, bunkName);
                });
            } catch (error) {
                console.error("Error loading stations: ", error);
            }
        }

        // Call the function to load stations
        loadStations();
    }
});



//
//  Booking
//


if (window.location.pathname.endsWith("booking.html")) {
    document.addEventListener("DOMContentLoaded", async () => {
        const bunkSelect = document.getElementById('bunkSelect');
        const slotSelect = document.getElementById('slotSelect');

        if (!bunkSelect || !slotSelect) {
            console.error("Element with IDs 'bunkSelect' or 'slotSelect' not found.");
            return; // Exit if the elements are not found
        }

        try {
            // Fetch all bunks
            const bunkSnapshot = await getDocs(collection(db, 'bunk'));
            const bunkDataMap = {};

            // Populate bunk dropdown
            bunkSnapshot.forEach(doc => {
                const bunk = doc.data();
                bunkDataMap[bunk.bunkName] = {
                    chargingType: bunk.chargingType,
                    location: bunk.location
                };

                const option = document.createElement('option');
                option.value = bunk.bunkName;
                option.textContent = `${bunk.bunkName} (${bunkDataMap[bunk.bunkName].location})`; // Show bunk name and location
                bunkSelect.appendChild(option);
            });

            // Add change event to bunkSelect
            bunkSelect.addEventListener('change', async () => {
                const selectedBunk = bunkSelect.value;

                // Clear the slot dropdown and disable it
                slotSelect.innerHTML = '<option value="">Select Slot</option>';
                slotSelect.disabled = true;

                if (selectedBunk) {
                    // Fetch available slots for the selected bunk
                    const availableSlotsQuery = query(
                        collection(db, 'slot'),
                        where("bunkName", "==", selectedBunk),
                        where("status", "==", "available") // Fetch only available slots
                    );
                    const slotSnapshot = await getDocs(availableSlotsQuery);

                    // Populate the slot dropdown
                    slotSnapshot.forEach(doc => {
                        const slot = doc.data();
                        const option = document.createElement('option');
                        option.value = slot.slotNumber;
                        option.textContent = `Slot Number: ${slot.slotNumber}`;
                        slotSelect.appendChild(option);
                    });

                    // Enable slotSelect if there are available slots
                    slotSelect.disabled = slotSelect.options.length === 1; // Disable if only the default option is available
                }
            });
        } catch (error) {
            console.error("Error fetching bunks or slots:", error);
        }
    });
}

const bookingForm = document.getElementById('bookingForm');
const slotSelect = document.getElementById('slotSelect'); // Define slotSelect correctly

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const selectedBunk = document.getElementById('bunkSelect').value; // Get selected bunk name
        const selectedSlotNumber = slotSelect.value; // Get the slot number selected
        const selectedSlotName = `${selectedBunk} ${selectedSlotNumber}`; // Construct slotName with bunkName + space + slotNumber

        // Log for debugging
        console.log("Selected Bunk:", selectedBunk);
        console.log("Selected Slot Name:", selectedSlotName);

        // Check if user is authenticated
        if (!auth.currentUser) {
            alert("You need to be logged in to book a slot.");
            return;
        }

        try {
            // Query to fetch the slot based on the constructed slotName
            const selectedSlotQuery = query(
                collection(db, 'slot'),
                where("slotName", "==", selectedSlotName), // Match the constructed slotName directly
                where("status", "==", "available") // Ensure the slot is still available
            );
            const slotSnapshot = await getDocs(selectedSlotQuery);
            let selectedSlot = null;

            // Check if the selected slot exists
            slotSnapshot.forEach(doc => {
                selectedSlot = { id: doc.id, ...doc.data() }; // Include document ID
            });

            // Log the selected slot details
            console.log("Slot Snapshot Count:", slotSnapshot.size);
            console.log("Selected Slot Data:", selectedSlot);

            // Check if the slot exists and is available
            if (!selectedSlot) {
                alert("Slot does not exist or is no longer available.");
                return;
            }

            // Update the slot status to 'booked'
            const slotRef = doc(db, 'slot', selectedSlot.id); // Get reference using ID
            const bookingTime = new Date(); // Get current device time
            await updateDoc(slotRef, { 
                status: 'booked',
            });

            //update the booking collection
            // Create a reference to the document with userId as the document ID
            const bookingDocRef = doc(collection(db, 'bookings'), auth.currentUser.uid);
            // Set the booking data, which will overwrite the document if it already exists
            await setDoc(bookingDocRef, {
                bunkName: selectedBunk,
                slotNumber: selectedSlotNumber,
                userId: auth.currentUser.uid,
                bookingTime: bookingTime
            });

            alert("Slot booked successfully!");

            // Redirect after booking
            window.location.href = "userpage.html"; 
        } catch (error) {
            console.error("Booking error:", error);
            alert(`Booking error: ${error.message}`);
        }
    });
}


//
//  Admin Dashboard
//


if (window.location.pathname.endsWith("admindashboard.html")) {
    document.addEventListener('DOMContentLoaded', () => {
        const addBunkLink = document.getElementById('addBunkLink');
        const manageBunkLink = document.getElementById('manageBunkLink');
        const manageUsersLink = document.getElementById('manageUsersLink');
        const removeSlotLink = document.getElementById('removeSlotLink');
        const analyticsLink = document.getElementById('analyticsLink');
        const markBunkLink = document.getElementById('markBunkLink');

        const addBunkFormContainer = document.getElementById('addBunkFormContainer');
        const manageBunkContainer = document.getElementById('manageBunkContainer');
        const manageUsersContainer = document.getElementById('manageUsersContainer');
        const removeSlotContainer = document.getElementById('removeSlotContainer');
        const analyticsContainer = document.getElementById('analyticsContainer');
        const markBunkContainer = document.getElementById('markBunkContainer');

        // Function to show a specific container
        const showContainer = (container) => {
            addBunkFormContainer.style.display = 'none';
            manageBunkContainer.style.display = 'none';
            manageUsersContainer.style.display = 'none';
            removeSlotContainer.style.display = 'none';
            analyticsContainer.style.display = 'none';
            markBunkContainer.style.display = 'none';

            if (container) {
                container.style.display = 'block';
            }
        };

        addBunkLink.addEventListener('click', () => showContainer(addBunkFormContainer));
        manageBunkLink.addEventListener('click', () => showContainer(manageBunkContainer));
        manageUsersLink.addEventListener('click', () => showContainer(manageUsersContainer));
        removeSlotLink.addEventListener('click', () => showContainer(removeSlotContainer));
        analyticsLink.addEventListener('click', () => showContainer(analyticsContainer));
        markBunkLink.addEventListener('click', () => showContainer(markBunkContainer));

        // Optionally show the welcome message initially
        showContainer(document.getElementById('content'));
    });
}


// Add Bunk


if (window.location.pathname.endsWith("admindashboard.html")) {
    document.addEventListener("DOMContentLoaded", () => {
        const addBunkForm = document.getElementById('addBunkForm');
        const messageContainer = document.getElementById('message');

        // Ensure the form and message container exist
        if (addBunkForm && messageContainer) {
            // Add event listener for form submission
            addBunkForm.addEventListener('submit', async (event) => {
                event.preventDefault(); // Prevent the default form submission

                // Get form values
                const bunkName = document.getElementById('bunkName').value.trim();
                const numSlots = document.getElementById('numSlots').value.trim();
                const location = document.getElementById('location').value.trim();
                const chargingType = document.getElementById('chargingtype').value.trim();
                const contact = document.getElementById('contact').value.trim();

                // Create a bunk object
                const bunkData = {
                    bunkName: bunkName,
                    numSlots: Number(numSlots),
                    location: location,
                    chargingType: chargingType,
                    contact: contact,
                };

                try {
                    // Check if the bunk with the same name already exists
                    const bunkDocRef = doc(db, 'bunk', bunkData.bunkName);
                    const docSnapshot = await getDoc(bunkDocRef);

                    if (docSnapshot.exists()) {
                        // Bunk with this name already exists
                        messageContainer.className = 'error show'; // Set error class and show
                        messageContainer.textContent = "Bunk already exists. Please use a different Bunk Name.";
                        messageContainer.style.display = "block";
                        setTimeout(() => {
                            messageContainer.classList.remove('show');
                            messageContainer.style.display = "none";
                        }, 2000);
                        return; // Exit the function to prevent adding the bunk
                    }

                    // Add the bunk data to Firestore with bunkName as the document ID
                    await setDoc(bunkDocRef, bunkData);
                    console.log("Bunk created successfully!");
                    messageContainer.className = 'success show'; // Set success class and show
                    messageContainer.textContent = "Bunk added successfully!";
                    messageContainer.style.display = "block";

                    // Optionally, reset the form after submission
                    addBunkForm.reset();
                    setTimeout(() => {
                        messageContainer.classList.remove('show');
                        messageContainer.style.display = "none";
                    }, 2000);
                } catch (error) {
                    console.error("Error adding bunk:", error);
                    messageContainer.className = 'error show';
                    messageContainer.textContent = "Error creating bunk. Please try again.";
                    messageContainer.style.display = "block";
                    setTimeout(() => {
                        messageContainer.classList.remove('show');
                        messageContainer.style.display = "none";
                    }, 2000);
                }
            });
        } else {
            console.error("Required elements not found: addBunkForm or messageContainer");
        }
    });
}

if (window.location.pathname.endsWith("admindashboard.html")) {
    // Get the addBunkForm element
    const addBunkForm = document.getElementById('addBunkForm');

    if (addBunkForm) { // Ensure the form exists before adding the event listener
        // Add event listener for form submission
        addBunkForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission

            // Get form values
            const bunkName = document.getElementById('bunkName').value.trim();
            const numSlots = parseInt(document.getElementById('numSlots').value);
            // const location = document.getElementById('location').value.trim();
            // const contact = document.getElementById('contact').value.trim();

            try {
                // Loop to create each slot document
                for (let i = 1; i <= numSlots; i++) {
                    const slotName = `${bunkName} ${i}`;
                    const slotData = {
                        bunkName: bunkName,
                        slotName: slotName,
                        slotNumber: i,
                        status: 'available'
                    };

                    // Reference to the slot document with custom document ID
                    const slotRef = doc(db, 'slot', slotName);

                    // Add slot data to Firestore
                    await setDoc(slotRef, slotData);
                }

                console.log("Bunk slots created successfully!");
                
                // Optionally, reset the form after submission
                addBunkForm.reset();

            } catch (error) {
                console.error("Error creating bunk slots:", error);
            }
        });
    } else {
        console.warn("Add Bunk Form not found on this page.");
    }
}


// Other Options on the sidebar


document.addEventListener("DOMContentLoaded", () => {
    // Function to show the selected container and hide others
    function showContainer(containerId) {
        const containerIds = [
            "manageUsersContainer",
            "manageBunkContainer",
            "removeSlotContainer",
            "analyticsContainer",
            "addBunkFormContainer",
            "markBunkContainer"
        ];

        // Hide all containers
        containerIds.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.style.display = "none";
            }
        });

        // Show the selected container
        const selectedContainer = document.getElementById(containerId);
        if (selectedContainer) {
            selectedContainer.style.display = "block";
        }
    }
    
    let currentBunkId; // Global variable to store the current bunk ID

// Function to list all bunks
async function listBunks() {
    const bunkListContainer = document.getElementById("bunkList");

    // Debugging log to track function calls
    console.log("listBunks called");

    // Clear the existing list to avoid duplication
    bunkListContainer.innerHTML = '';

    try {
        const bunkSnapshot = await getDocs(collection(db, "bunk"));
        console.log("Fetched bunks:", bunkSnapshot.docs.length); // Log the number of bunks fetched
        
        bunkSnapshot.forEach(bunkDoc => {
            const bunkData = bunkDoc.data();
            const bunkItem = document.createElement("div");
            bunkItem.classList.add("bunk-item");
            bunkItem.innerHTML = `
                <p><strong>Bunk Name:</strong> ${bunkData.bunkName || "Unknown"} | <strong>Location:</strong> ${bunkData.location || "Unknown"}</p>
                <button class="addslot-bunk-btn">Add +1 slot</button>
                <button class="edit-bunk-btn">Edit Bunk</button>
                <button class="delete-bunk-btn">Remove Bunk</button>
            `;

            // Event listener for the Add Slot button
            bunkItem.querySelector(".addslot-bunk-btn").addEventListener("click", async () => {
                await add1Slot(bunkDoc.id); // Pass the bunk ID to add1Slot
                // After adding a slot, re-fetch the bunks to refresh the list
                listBunks();
            });

            // Event listener for the Edit button
            bunkItem.querySelector(".edit-bunk-btn").addEventListener("click", () => {
                editBunk(bunkDoc.id);
            });

            // Event listener for the Delete button
            bunkItem.querySelector(".delete-bunk-btn").addEventListener("click", () => {
                removeBunk(bunkDoc.id);
            });

            // Append the bunkItem to the list
            bunkListContainer.appendChild(bunkItem);
        });
    } catch (error) {
        console.error("Error listing bunks:", error);
    }
}


// Function to add one slot to a bunk


async function add1Slot(bunkId) {
    try {
        // Fetch the current number of slots for the given bunk
        const bunkDocRef = doc(db, "bunk", bunkId);
        const bunkDoc = await getDoc(bunkDocRef);

        if (bunkDoc.exists()) {
            const bunkData = bunkDoc.data();
            const numSlots = bunkData.numSlots || 0; // Get current number of slots

            // Calculate the new slot number based on current slots
            const newSlotNumber = numSlots + 1;
            const slotName = `${bunkData.bunkName} ${newSlotNumber}`; // Correctly increment slot name

            const slotData = {
                bunkName: bunkData.bunkName,
                slotName: slotName,
                slotNumber: newSlotNumber,
                status: 'available' // Assuming new slots are available by default
            };

            // Reference to the new slot document with a unique document ID
            const slotRef = doc(db, 'slot', slotName);

            // Add slot data to Firestore
            await setDoc(slotRef, slotData);

            // Update the bunk's number of slots in Firestore
            await updateDoc(bunkDocRef, {
                numSlots: newSlotNumber
            });

            alert(`Slot "${slotName}" added successfully!`);
            console.log("Slot added:", slotData);
        } else {
            console.error("Bunk does not exist.");
            alert("Error: Bunk not found.");
        }
    } catch (error) {
        console.error("Error adding slot:", error);
        alert("Error adding slot. Please try again.");
    }
}


// Function to delete a bunk and its associated slots


async function removeBunk(bunkId) {
    if (!confirm(`Are you sure you want to delete the bunk "${bunkId}" and all its slots?`)) {
        return;
    }

    try {
        // Delete all slots associated with the bunk
        const slotSnapshot = await getDocs(query(collection(db, "slot"), where("bunkName", "==", bunkId)));
        const deleteSlotPromises = slotSnapshot.docs.map(slotDoc => deleteDoc(slotDoc.ref));
        await Promise.all(deleteSlotPromises);

        // Delete the bunk document
        await deleteDoc(doc(db, "bunk", bunkId));

        alert(`Bunk "${bunkId}" and all associated slots have been deleted.`);
        listBunks(); // Refresh the bunk list
    } catch (error) {
        console.error("Error removing bunk:", error);
    }
}


// Function to edit a bunk


async function editBunk(bunkId) {
    console.log("Editing bunk with ID:", bunkId); // Debugging log
    currentBunkId = bunkId;

    try {
        const bunkDocRef = doc(db, "bunk", bunkId);
        const bunkDoc = await getDoc(bunkDocRef);

        if (bunkDoc.exists()) {
            const bunkData = bunkDoc.data();
            document.getElementById("editLocation").value = bunkData.location || "";
            document.getElementById("editContact").value = bunkData.contact || "";
            document.getElementById("editNumSlot").value = bunkData.numSlots || 0; // Change numSlot to numSlots
            document.getElementById("editBunkModal").style.display = "flex"; // Show the modal
            console.log("Modal data filled:", bunkData); // Check the data being set
        } else {
            alert("Bunk data could not be fetched for editing.");
        }
    } catch (error) {
        console.error("Error fetching bunk data:", error);
    }
}

if (window.location.pathname.endsWith("admindashboard.html")) {
    // Save bunk changes
    const saveBunkChangesButton = document.getElementById("saveBunkChanges");

    if (saveBunkChangesButton) {
        saveBunkChangesButton.addEventListener("click", async () => {
            const newLocation = document.getElementById("editLocation").value;
            const newContact = document.getElementById("editContact").value;
            const newNumSlots = parseInt(document.getElementById("editNumSlot").value); // Change numSlot to numSlots

            if (!newLocation || !newContact || isNaN(newNumSlots)) {
                alert("Please fill out all fields.");
                return;
            }

            try {
                // Update bunk details
                await updateDoc(doc(db, "bunk", currentBunkId), {
                    location: newLocation,
                    contact: newContact,
                    numSlots: newNumSlots // Change numSlot to numSlots
                });

                alert("Bunk updated successfully!");
                document.getElementById("editBunkModal").style.display = "none"; // Hide modal
                listBunks(); // Refresh the bunk list
            } catch (error) {
                console.error("Error updating bunk:", error);
            }
        });
    } else {
        console.warn("Save Bunk Changes button not found on this page.");
    }
}

if (window.location.pathname.endsWith("admindashboard.html")) {
    const closeModalButton = document.getElementById("closeModal");
    if (closeModalButton) {
        closeModalButton.addEventListener("click", () => {
            document.getElementById("editBunkModal").style.display = "none"; // Hide the modal
        });
    }

    // Show the manage bunk container and list bunks when the "Manage Bunk" link is clicked
    const manageBunkLink = document.getElementById("manageBunkLink");
    if (manageBunkLink) {
        manageBunkLink.addEventListener("click", () => {
            document.getElementById("addBunkFormContainer").style.display = "none";
            document.getElementById("manageUsersContainer").style.display = "none";
            document.getElementById("removeSlotContainer").style.display = "none";
            document.getElementById("analyticsContainer").style.display = "none";
            
            // Show the manage bunk container
            document.getElementById("manageBunkContainer").style.display = "block";

            // Load the bunks only if not already loaded
            if (!document.getElementById("bunkList").childElementCount) {
                listBunks(); // Load the bunks if the list is empty
            }
        });
    } else {
        console.warn("Manage Bunk link not found on this page.");
    }

    document.addEventListener("DOMContentLoaded", () => {
        listBunks(); // Call to load bunks initially
    });
    }


    // Function to fetch and display users


    async function fetchUsers() {
        const usersContainer = document.getElementById("userList");
        usersContainer.innerHTML = ''; // Clear existing content

        try {
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            
            if (usersSnapshot.empty) {
                usersContainer.textContent = "No users found.";
                return;
            }

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const userDiv = document.createElement("div");
                userDiv.textContent = `${userData.email} - ${userData.role}`;
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete User";
                deleteButton.addEventListener("click", () => deleteUser(doc.id));
                userDiv.appendChild(deleteButton);
                usersContainer.appendChild(userDiv);
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            usersContainer.textContent = "Error fetching users. Please try again.";
        }
    }

    // Function to delete a user
    async function deleteUser(userId) {
        try {
            await deleteDoc(doc(db, "users", userId));
            console.log("User deleted successfully!");
            fetchUsers(); // Refresh the user list
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    }


    // Function to fetch and display slots for removal
    
    async function fetchSlots() {
    const slotsContainer = document.getElementById("slotList");
    slotsContainer.innerHTML = '';

    try {
        const slotsCollection = collection(db, "slot");
        const slotsSnapshot = await getDocs(slotsCollection);
        
        if (slotsSnapshot.empty) {
            slotsContainer.textContent = "No slots found.";
            return;
        }

        slotsSnapshot.forEach(doc => {
            const slotData = doc.data();
            const slotDiv = document.createElement("div");

            // Display slot name with its status
            slotDiv.textContent = `${slotData.slotName} - ${slotData.status || "Unknown Status"}`;
            
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove Slot";
            removeButton.addEventListener("click", () => removeSlot(doc.id));

            slotDiv.appendChild(removeButton);
            slotsContainer.appendChild(slotDiv);
        });
    } catch (error) {
        console.error("Error fetching slots:", error);
        slotsContainer.textContent = "Error fetching slots. Please try again.";
    }
    }

    // Function to remove a slot
    async function removeSlot(slotId) {
        try {
            await deleteDoc(doc(db, "slot", slotId));
            console.log("Slot removed successfully!");
            fetchSlots(); // Refresh the slot list
        } catch (error) {
            console.error("Error removing slot:", error);
        }
    }


    // Function to fetch and display analytics
    
    
    async function fetchAnalytics() {
        const analyticsContainer = document.getElementById("analyticsContainer");
        analyticsContainer.innerHTML = ''; // Clear existing content

        try {
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            const userCount = usersSnapshot.size;

            const slotsCollection = collection(db, "slot");
            const slotsSnapshot = await getDocs(slotsCollection);
            const slotCount = slotsSnapshot.size;

            analyticsContainer.innerHTML = `
            <h2 class="analytics-title">Analytics Overview</h2>
            <p>Total Users: <span class="number">${userCount}</span></p>
            <p>Total Charging Slots: <span class="number">${slotCount}</span></p>
            `;

        } catch (error) {
            console.error("Error fetching analytics:", error);
            analyticsContainer.textContent = "Error fetching analytics. Please try again.";
        }
    }


    //
    //Bunk on Map
    //


    if (window.location.href.includes('admindashboard.html')) {

        async function populateBunkDropdown() {
        const bunkSelect = document.getElementById('bunkSelect');
    
        try {
            const querySnapshot = await getDocs(collection(db, "bunk"));
    
            // Check if querySnapshot has any documents
            if (querySnapshot.empty) {
                console.log("No bunk documents found.");
                return;
            }
            
            bunkSelect.innerHTML = '<option value="" disabled selected>Select a bunk</option>';
            
            querySnapshot.forEach((doc) => {
                const bunkName = doc.id; // Get the document ID (bunk name)
                const option = document.createElement('option');
                option.value = bunkName;
                option.textContent = bunkName;
                bunkSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error("Error fetching bunk names:", error);
        }
    }

    // Call the function to populate the bunk dropdown
    populateBunkDropdown();

    //Map
    const mapElement = document.getElementById('adminMap');
    if (mapElement) {
        const map = L.map('adminMap').setView([12.9716, 77.5946], 13);
    
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    
        // Variables to store selected coordinates
        let selectedLat, selectedLng;
    
        // Add click event to get latitude and longitude from the map
        map.on('click', function (e) {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
    
            // Display the coordinates in the input fields
            document.getElementById('latitude').value = selectedLat;
            document.getElementById('longitude').value = selectedLng;
        });
    
        // Event listener for "Save Location" button
        document.getElementById("saveLocation").addEventListener("click", async () => {
            const bunkSelect = document.getElementById("bunkSelect");
            const selectedBunk = bunkSelect.value;
    
            if (!selectedBunk) {
                alert("Please select a bunk.");
                return;
            }
    
            if (!selectedLat || !selectedLng) {
                alert("Please select a location on the map.");
                return;
            }
    
            try {
                // Store latitude and longitude in Firestore under the selected bunkName in the 'map' collection
                await setDoc(doc(db, "map", selectedBunk), {
                    bunkName: selectedBunk,
                    latitude: selectedLat,
                    longitude: selectedLng
                });
    
                document.getElementById("markBunkMessage").style.display = "block";
                document.getElementById("markBunkMessage").textContent = "Location saved successfully!";
                
                // Clear the fields after saving
                document.getElementById('latitude').value = '';
                document.getElementById('longitude').value = '';
                bunkSelect.value = '';
    
            } catch (error) {
                console.error("Error saving location:", error);
                document.getElementById("markBunkMessage").style.display = "block";
                document.getElementById("markBunkMessage").textContent = "Failed to save location.";
            }
        });
    }

    }

    // Event Listeners

    if (window.location.pathname.endsWith("admindashboard.html")) {


    const manageUsersLink = document.getElementById("manageUsersLink");
    if (manageUsersLink) {
        manageUsersLink.addEventListener("click", () => {
            showContainer("manageUsersContainer");
            fetchUsers(); // Fetch users when this link is clicked
        });
    }

    const removeSlotLink = document.getElementById("removeSlotLink");
    if (removeSlotLink) {
        removeSlotLink.addEventListener("click", () => {
            showContainer("removeSlotContainer");
            fetchSlots(); // Fetch slots when this link is clicked
        });
    }

    const analyticsLink = document.getElementById("analyticsLink");
    if (analyticsLink) {
        analyticsLink.addEventListener("click", () => {
            showContainer("analyticsContainer");
            fetchAnalytics(); // Fetch analytics when this link is clicked
        });
    }

    const addBunkLink = document.getElementById("addBunkLink");
    if (addBunkLink) {
        addBunkLink.addEventListener("click", () => {
            showContainer("addBunkFormContainer");
        });
    }

    const markBunkLink = document.getElementById("markBunkLink");
    if (markBunkLink) {
        markBunkLink.addEventListener("click", () => {
            showContainer("markBunkContainer");
        });
    }
    }

    // Default container on page load
    showContainer("addBunkFormContainer");
});


//
// sidebar option
//


document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links
            navLinks.forEach(nav => nav.classList.remove('active-link'));

            // Add active class to the clicked link
            link.classList.add('active-link');
        });
    });
});
