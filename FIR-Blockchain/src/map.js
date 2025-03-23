let firContract;
window.addEventListener('load', async () => {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await ethereum.request({ method: 'eth_requestAccounts' });

        // Check if officer is logged in
        const isOfficerLoggedIn = localStorage.getItem("isOfficerLoggedIn");
        if (isOfficerLoggedIn === "true") {
            document.getElementById("createFIRButton").style.display = "block";
            document.getElementById("loginStatus").innerText = "Logged in as Officer";
        } else {
            document.getElementById("loginStatus").innerText = "Not Logged in";
        }

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

        loadMapWithFIRs();
    } else {
        alert("Please install MetaMask.");
    }
});

async function loadMapWithFIRs() {
    // Load and display FIRs with markers
    const totalFIRs = await firContract.methods.getTotalFIRs().call();
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Default India center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

    for (let i = 0; i < totalFIRs; i++) {
        const fir = await firContract.methods.getFIR(i).call();
        const coordinates = await getCoordinates(fir.incidentLocation);
        if (coordinates) {
            L.marker([coordinates.lat, coordinates.lng]).addTo(map)
                .bindPopup(`<b>FIR ID:</b> ${fir.FIRID}<br><b>Location:</b> ${fir.incidentLocation}`);
        }
    }
}

async function getCoordinates(location) {
    const apiKey = '32596d57fca24156ba101b641438eed4'; // Use a valid API key from a geocoding service like OpenCage or Google Maps
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results[0].geometry : null;
}
