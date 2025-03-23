let firContract;
window.addEventListener('load', async () => {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);

        document.getElementById('connectButton')?.addEventListener("click", async () => {
            try {
                connectWallet();
            } catch (error) {
                console.error("Wallet connection error:", error);
                showPopupMessage("error", "Please connect your MetaMask wallet to proceed.");
            }
        });

        const networkId = await web3.eth.net.getId();
        console.log('Network ID:', networkId);

        const contractAddress = '0xf1bc050f0914fb50f3d0c479ea1f21f755bec50b';
        const abi = [ {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "firs",
          "outputs": [
            {
              "internalType": "string",
              "name": "FIRID",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "policeStation",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "criminalDetails",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "incidentLocation",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "victimDetails",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "officerDetails",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_FIRID",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_policeStation",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_criminalDetails",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_incidentLocation",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_victimDetails",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_officerDetails",
              "type": "string"
            }
          ],
          "name": "createFIR",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "index",
              "type": "uint256"
            }
          ],
          "name": "getFIR",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "FIRID",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "policeStation",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "criminalDetails",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "incidentLocation",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "victimDetails",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "officerDetails",
                  "type": "string"
                }
              ],
              "internalType": "struct FIR.FIRDetails",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        },
        {
          "inputs": [],
          "name": "getTotalFIRs",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function",
          "constant": true
        } ];

        firContract = new web3.eth.Contract(abi, contractAddress);

        const firForm = document.getElementById('firForm');
        if (firForm) {
            firForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                saveAndSubmitFIR();
            });
        }
    } else {
        console.log("MetaMask not detected.");
    }
});

// Save FIR data and submit to blockchain
async function saveAndSubmitFIR() {
    const firID = document.getElementById('firID').value;
    const policeStation = document.getElementById('policeStation').value;
    const criminalDetails = document.getElementById('criminalDetails').value;
    const incidentLocation = document.getElementById('incidentLocation').value;
    const victimDetails = document.getElementById('victimDetails').value;
    const officerDetails = document.getElementById('officerDetails').value;

    // Validate fields
    if (!firID || !policeStation || !incidentLocation) {
        showPopupMessage('error', 'Please fill in all required fields: FIR ID, Police Station, and Incident Location');
        return;
    }

    try {
        // Connect to wallet first if needed
        if (document.getElementById('connectButton') && !isWalletConnected()) {
            showPopupMessage('info', 'Please connect your wallet to continue', 0);
            return;
        }

        // Show loading popup
        showPopupMessage('loading', 'Processing your FIR submission...');
        
        // Get coordinates for the incident location
        let coordinates = null;
        try {
            coordinates = await getCoordinates(incidentLocation);
        } catch (error) {
            console.error("Error getting coordinates:", error);
            // Continue even if geocoding fails
        }
        
        // Store FIR data in localStorage for search functionality
        const firData = JSON.parse(localStorage.getItem('firData')) || [];
        const newFIR = {
            firID,
            policeStation,
            criminalDetails,
            incidentLocation,
            victimDetails,
            officerDetails,
            timestamp: new Date().toISOString(),
            coordinates: coordinates
        };
        firData.push(newFIR);
        localStorage.setItem('firData', JSON.stringify(firData));

        // Also store in older format for backward compatibility
        const firLocations = JSON.parse(localStorage.getItem('firLocations')) || [];
        firLocations.push({
            firID,
            incidentLocation,
            coordinates: coordinates
        });
        localStorage.setItem('firLocations', JSON.stringify(firLocations));

        // Try to submit to blockchain if connected
        if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
            try {
                const web3 = new Web3(window.ethereum);
                const accounts = await web3.eth.getAccounts();
                if (accounts.length > 0) {
                    await firContract.methods.createFIR(
                        firID, policeStation, criminalDetails, incidentLocation, victimDetails, officerDetails
                    ).send({ from: accounts[0], gas: 3000000 });
                }
            } catch (error) {
                console.error("Error submitting to blockchain:", error);
                // Continue even if blockchain submission fails
            }
        }

        // Show success popup with countdown
        showPopupMessage('success', 'FIR successfully submitted!', 3, function() {
            // Redirect to map page after popup closes
            window.location.href = 'map.html?firID=' + encodeURIComponent(firID);
        });
        
    } catch (error) {
        console.error('Error saving FIR:', error);
        showPopupMessage('error', 'Failed to submit FIR. Please try again.');
    }
}

// Check if wallet is connected
function isWalletConnected() {
    return window.ethereum && window.ethereum.selectedAddress;
}

// Connect to MetaMask wallet
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            showPopupMessage('loading', 'Connecting to wallet...');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length > 0) {
                // Update UI to show connected state
                const connectButton = document.getElementById('connectButton');
                if (connectButton) {
                    connectButton.textContent = 'Wallet Connected';
                    connectButton.disabled = true;
                }
                
                showPopupMessage('success', 'Wallet connected successfully!', 2);
                return accounts[0];
            } else {
                showPopupMessage('error', 'No accounts found. Please create an account in MetaMask.');
                return null;
            }
        } catch (error) {
            console.error('Error connecting to wallet:', error);
            let errorMessage = 'Failed to connect wallet.';
            
            if (error.code === 4001) {
                errorMessage = 'You rejected the connection request.';
            } else if (error.code === -32002) {
                errorMessage = 'Connection request already pending. Please check MetaMask.';
            }
            
            showPopupMessage('error', errorMessage);
            return null;
        }
    } else {
        showPopupMessage('error', 'MetaMask not detected. Please install MetaMask to continue.', 0, function() {
            window.open('https://metamask.io/download.html', '_blank');
        });
        return null;
    }
}

// Function to get coordinates from location using OpenCage API
async function getCoordinates(location) {
    try {
        const apiKey = '32596d57fca24156ba101b641438eed4'; // OpenCage API key
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const coords = data.results[0].geometry;
            return {
                lat: coords.lat,
                lng: coords.lng
            };
        } else {
            console.warn('No coordinates found for location:', location);
            return null;
        }
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

// Function to show popup message with optional countdown and callback
function showPopupMessage(type, message, countdown = 0, callback = null) {
    // Create popup container if it doesn't exist
    let popup = document.getElementById('popup-message');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'popup-message';
        document.body.appendChild(popup);
        
        // Add style for the popup
        const style = document.createElement('style');
        style.textContent = `
            #popup-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 90%;
                width: 400px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 9999;
                overflow: hidden;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #popup-message.show {
                opacity: 1;
            }
            #popup-message .popup-header {
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #eee;
            }
            #popup-message .popup-content {
                padding: 20px;
                text-align: center;
            }
            #popup-message .popup-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            #popup-message .popup-message {
                font-size: 18px;
                margin-bottom: 10px;
            }
            #popup-message .popup-countdown {
                font-size: 14px;
                color: #777;
            }
            #popup-message .popup-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #777;
                margin: 0;
                padding: 0;
                width: auto;
                box-shadow: none;
            }
            #popup-message .popup-close:hover {
                color: #333;
                transform: none;
            }
            #popup-message.success .popup-icon { color: #2ecc71; }
            #popup-message.error .popup-icon { color: #e74c3c; }
            #popup-message.loading .popup-icon { color: #3498db; }
            #popup-message.info .popup-icon { color: #f39c12; }
            #popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0,0,0,0.6);
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #popup-overlay.show {
                opacity: 1;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinning {
                animation: spin 1.5s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('popup-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        document.body.appendChild(overlay);
    }
    
    // Set popup content based on type
    let iconClass = '';
    let popupClass = '';
    
    switch(type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            popupClass = 'success';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            popupClass = 'error';
            break;
        case 'loading':
            iconClass = 'fas fa-spinner spinning';
            popupClass = 'loading';
            break;
        case 'info':
            iconClass = 'fas fa-info-circle';
            popupClass = 'info';
            break;
        default:
            iconClass = 'fas fa-info-circle';
            popupClass = 'info';
    }
    
    // Set popup content
    popup.className = popupClass;
    popup.innerHTML = `
        <div class="popup-header">
            <div></div>
            <button class="popup-close" onclick="closePopup()">&times;</button>
        </div>
        <div class="popup-content">
            <div class="popup-icon"><i class="${iconClass}"></i></div>
            <div class="popup-message">${message}</div>
            ${countdown > 0 ? `<div class="popup-countdown">Closing in <span id="countdown">${countdown}</span> seconds</div>` : ''}
        </div>
    `;
    
    // Define close function in global scope
    window.closePopup = function() {
        popup.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    };
    
    // Show popup and overlay with animation
    setTimeout(() => {
        popup.classList.add('show');
        overlay.classList.add('show');
    }, 10);
    
    // Handle countdown if specified
    if (countdown > 0) {
        let remainingSeconds = countdown;
        const countdownElement = document.getElementById('countdown');
        
        const countdownInterval = setInterval(() => {
            remainingSeconds--;
            if (countdownElement) countdownElement.textContent = remainingSeconds;
            
            if (remainingSeconds <= 0) {
                clearInterval(countdownInterval);
                window.closePopup();
            }
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize listener for form submission
    if (document.getElementById('firForm')) {
        document.getElementById('firForm').addEventListener('submit', function(event) {
            event.preventDefault();
            handleFormSubmit();
        });
    }

    // Check if user is already logged in
    checkLoginStatus();
});

// Handle form submission
async function handleFormSubmit() {
    // Functionality has been moved to saveAndSubmitFIR
    // This function is kept for backward compatibility
    if (typeof saveAndSubmitFIR === 'function') {
        saveAndSubmitFIR();
    } else {
        console.error('saveAndSubmitFIR function not found');
    }
}

// Check login status
function checkLoginStatus() {
    // Implementation of checkLoginStatus function
}
