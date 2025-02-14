$(document).ready(function() {
    let dataTable;
    
    // Function to fetch data from GitHub Pages
    async function fetchData() {
        try {
            const response = await fetch('https://bittumon.github.io/rendriel/TUTTI-plant_data.json');
            const data = await response.json();
            return processMonTuttiData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            $('.container').prepend(`
                <div class="error-banner" style="margin-bottom: 20px; background: #ffe6e6; padding: 10px; border-radius: 4px; color: #ff0000;">
                    Error loading data: ${error.message}
                </div>
            `);
            return [];
        }
    }

    // Process MON-TUTTI data from JSON
    function processMonTuttiData(data) {
        const monTuttiData = [];
        const monTutti = data.data_first_set[0]['1']['MON-TUTTI'];
        
        for (const device in monTutti) {
            const deviceData = monTutti[device];
            for (const date in deviceData) {
                const entry = deviceData[date];
                monTuttiData.push({
                    date: date,
                    device: device,
                    problems: entry.Problemi,
                    internalNotification: entry['Segnalazione interno '],
                    customerNotification: entry['Segnalazione Cliente'],
                    solution: entry.Soluzione,
                    internalResponsible: entry['Responsabile Interno'],
                    action: entry.Azione,
                    status: entry.stato
                });
            }
        }
        return monTuttiData;
    }

    // Initialize DataTable
    async function initializeDataTable() {
        const data = await fetchData();
        
        dataTable = $('#monTuttiTable').DataTable({
            data: data,
            responsive: true,
            columns: [
                { data: 'date' },
                { data: 'device' },
                { data: 'problems' },
                { data: 'internalNotification' },
                { data: 'customerNotification' },
                { data: 'solution' },
                { data: 'internalResponsible' },
                { data: 'action' },
                { data: 'status' }
            ],
            order: [[0, 'desc']],
            pageLength: 25,
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)"
            }
        });

        // Populate filter dropdowns
        populateFilters(data);
    }

    // Populate filter dropdowns
    function populateFilters(data) {
        const devices = [...new Set(data.map(item => item.device))];

        const deviceFilter = $('#deviceFilter');

        devices.forEach(device => {
            deviceFilter.append(`<option value="${device}">${device}</option>`);
        });
    }

    // Apply filters
    function applyFilters() {
        const deviceFilter = $('#deviceFilter').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();
        const activeStatusButtons = $('.status-button.active').map(function() {
            return $(this).data('status');
        }).get();

        $.fn.dataTable.ext.search.pop();
        
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                const device = data[1];
                const status = data[8];
                const dateParts = data[0].split('/');
                const date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                
                const deviceMatch = !deviceFilter || device === deviceFilter;
                const statusMatch = !activeStatusButtons.length || activeStatusButtons.includes(status);
                const dateMatch = (!startDate || date >= new Date(startDate)) &&
                                (!endDate || date <= new Date(endDate));

                return deviceMatch && statusMatch && dateMatch;
            }
        );

        dataTable.draw();
    }

    // Event listeners for filters
    $('#deviceFilter').on('change', applyFilters);
    $('#startDate, #endDate').on('change', applyFilters);

    // Event listeners for status buttons
    $('.status-button').on('click', function() {
        $(this).toggleClass('active');
        applyFilters();
    });

    // Add timestamp and user info
    const timestamp = "2025-02-14 22:34:08"; // Using the provided timestamp
    $('.container').prepend(`
        <div class="info-banner" style="margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            <div>Current Time (UTC): ${timestamp}</div>
            <div>User: bittumon</div>
        </div>
    `);

    // Initialize the table
    initializeDataTable();
});
