// ==UserScript==
// @name         Show Connections on Cables in Netbox
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Display connection (Device port - port Device) connected to cables in NetBox Topology Views, right click to add and with right-click option to rotate text boxes via input
// @author       SureimAndreas@github
// @match        https://<netbox url>/plugins/netbox_topology_views/topology/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log("Script is running!");

    let processedConnections = new Set(); // Keep track of processed connections to avoid duplicates
    let activeLabel = null; // Track the currently selected label for rotation

    // Create a context menu for adding connections
    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'absolute';
    contextMenu.style.backgroundColor = '#1f2937'; // Match NetBox background
    contextMenu.style.color = '#ffffff';
    contextMenu.style.padding = '10px';
    contextMenu.style.borderRadius = '5px';
    contextMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.5)';
    contextMenu.style.display = 'none';
    contextMenu.style.zIndex = 10000;

    const addConnectionButton = document.createElement('button');
    addConnectionButton.textContent = 'Add Connection';
    addConnectionButton.style.backgroundColor = '#4299e1'; // Blue button
    addConnectionButton.style.color = '#ffffff';
    addConnectionButton.style.border = 'none';
    addConnectionButton.style.padding = '8px 12px'; // Adjusted padding for better appearance
    addConnectionButton.style.borderRadius = '5px'; // Rounded corners
    addConnectionButton.style.cursor = 'pointer';
    addConnectionButton.style.fontSize = '14px'; // Match NetBox font size
    addConnectionButton.style.fontWeight = 'bold';

    // Append the button to the context menu
    contextMenu.appendChild(addConnectionButton);
    document.body.appendChild(contextMenu);
    // Create a second context menu for rotating text boxes
    const angleContextMenu = document.createElement('div');
    angleContextMenu.style.position = 'absolute';
    angleContextMenu.style.backgroundColor = '#1f2937'; // Match NetBox background
    angleContextMenu.style.color = '#ffffff';
    angleContextMenu.style.padding = '10px';
    angleContextMenu.style.borderRadius = '5px';
    angleContextMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.5)';
    angleContextMenu.style.display = 'none';
    angleContextMenu.style.zIndex = 10000;

    const degreeInputField = document.createElement('input');
    degreeInputField.type = 'number';
    degreeInputField.placeholder = 'Degrees...';
    degreeInputField.style.marginRight = '10px';
    degreeInputField.style.padding = '5px';
    degreeInputField.style.borderRadius = '3px';

    const applyAngleButton = document.createElement('button');
    applyAngleButton.textContent = 'Angle';
    applyAngleButton.style.backgroundColor = '#4299e1'; // Blue button
    applyAngleButton.style.color = '#ffffff';
    applyAngleButton.style.border = 'none';
    applyAngleButton.style.padding = '8px 12px'; // Adjusted padding for better appearance
    applyAngleButton.style.borderRadius = '5px'; // Rounded corners
    applyAngleButton.style.cursor = 'pointer';

    // Append the input and button to the second context menu
    angleContextMenu.appendChild(degreeInputField);
    angleContextMenu.appendChild(applyAngleButton);
    document.body.appendChild(angleContextMenu);
  
      // Prevent closing the angle context menu when clicking inside it
    angleContextMenu.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent click event from propagating to the document
    });
  
  	// Append the button to the context menu
		contextMenu.appendChild(addConnectionButton);
		document.body.appendChild(contextMenu);


    // Function to process and display connection details
    function showConnection(event, tooltipContent) {
        const match = tooltipContent.match(/Cable between\n(.+?) \[(.+?)\]\n(.+?) \[(.+?)\]/);
        if (match) {
            const sourceDevice = match[1];
            const sourcePort = match[2];
            const targetDevice = match[3];
            const targetPort = match[4];

            console.log(`Found cable: ${sourceDevice} (${sourcePort}) ↔ ${targetDevice} (${targetPort})`);

            // Generate a unique key for this connection to avoid duplicates
            const connectionKey = `${sourceDevice}-${sourcePort}-${targetDevice}-${targetPort}`;
            if (processedConnections.has(connectionKey)) return;

            // Create a label element for displaying port numbers
            const label = document.createElement('div');
            label.textContent = `${sourcePort} ↔ ${targetPort}`;
            label.style.position = 'absolute';
            label.style.color = '#4299e1'; // Blue text color
            label.style.fontWeight = 'bold'; // Bold text
            label.style.fontSize = '12px';
            label.style.backgroundColor = '#1f2937'; // Match NetBox background
            label.style.padding = '5px';
            label.style.borderRadius = '5px';
            label.style.zIndex = 1000;
            label.style.cursor = 'move'; // Indicate that the object is draggable

            // Position the label near the cursor position
            label.style.left = `${event.pageX + 10}px`; // Offset slightly to the right of the cursor
            label.style.top = `${event.pageY + 10}px`; // Offset slightly below the cursor

            let isDragging = false;
            let offsetX, offsetY;

            // Add drag functionality to make the label movable
            label.addEventListener('mousedown', function (e) {
                isDragging = true;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
                document.body.style.userSelect = 'none'; // Disable text selection while dragging
            });

            document.addEventListener('mousemove', function (e) {
                if (isDragging) {
                    label.style.left = `${e.pageX - offsetX}px`;
                    label.style.top = `${e.pageY - offsetY}px`;
                }
            });

            document.addEventListener('mouseup', function () {
                isDragging = false;
                document.body.style.userSelect = ''; // Re-enable text selection after dragging
            });

            // Add right-click functionality for rotating text boxes via input field
            label.addEventListener('contextmenu', function (e) {
                e.preventDefault();

                // Show the angle context menu at the cursor position
                angleContextMenu.style.left = `${e.pageX}px`;
                angleContextMenu.style.top = `${e.pageY}px`;
                angleContextMenu.style.display = 'block';

                // Set the active label for rotation
                activeLabel = label;

                // Clear previous input value
                degreeInputField.value = '';

                // Add a click event listener to the "Angle" button
                applyAngleButton.onclick = () => {
                    const degrees = parseFloat(degreeInputField.value);
                    if (!isNaN(degrees)) {
                        activeLabel.style.transform = `rotate(${degrees}deg)`; // Apply rotation
                        console.log(`Rotated text box by ${degrees} degrees`);
                        angleContextMenu.style.display = 'none'; // Hide the menu after applying rotation
                    } else {
                        alert('Please enter a valid number for degrees.');
                    }
                };
            });


            // Append the label to the body
            document.body.appendChild(label);

            // Mark this connection as processed
            processedConnections.add(connectionKey);
        }
    }
    // Function to handle right-click events on text boxes
    function handleTextBoxRightClick(event, label) {
        event.preventDefault();

        // Show the angle context menu at the cursor position
        angleContextMenu.style.left = `${event.pageX}px`;
        angleContextMenu.style.top = `${event.pageY}px`;
        angleContextMenu.style.display = 'block';

        // Set the active label for rotation
        activeLabel = label;

        // Clear previous input value
        degreeInputField.value = '';

        // Add a click event listener to the "Angle" button
        applyAngleButton.onclick = () => {
            const degrees = parseFloat(degreeInputField.value);
            if (!isNaN(degrees)) {
                activeLabel.style.transform = `rotate(${degrees}deg)`; // Apply rotation
                console.log(`Rotated text box by ${degrees} degrees`);
                angleContextMenu.style.display = 'none'; // Hide the menu after applying rotation
            } else {
                alert('Please enter a valid number for degrees.');
            }
        };
    }

    // Function to handle right-click events on cables
    function handleRightClick(event) {
        event.preventDefault();

        const tooltip = document.querySelector('.vis-tooltip');
        if (tooltip && tooltip.style.visibility === 'visible') {
            const tooltipContent = tooltip.innerText;

            // Show the context menu at the cursor position
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.display = 'block';

            // Add a click event listener to the "Add Connection" button
            const addConnectionHandler = () => {
                showConnection(event, tooltipContent);
                contextMenu.style.display = 'none'; // Hide the menu after selection
                document.removeEventListener('click', addConnectionHandler); // Remove this listener after use
            };

            addConnectionButton.addEventListener('click', addConnectionHandler, { once: true });
        }
    }

    // Hide the context menu when clicking elsewhere
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        angleContextMenu.style.display = 'none';
    });

    // Attach right-click event listener to the vis-network container
    const visNetworkContainer = document.querySelector('.vis-network');
    if (visNetworkContainer) {
        visNetworkContainer.addEventListener('contextmenu', handleRightClick);
    } else {
        console.error("vis-network container not found!");
    }
})();
