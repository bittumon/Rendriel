$(document).ready(function() {
    let dataTable;
    
    // Function to fetch data from the API
    async function fetchData() {
        try {
            const response = await fetch('YOUR_API_ENDPOINT');
            const data = await response.json();
            return processMonTuttiData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
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
            dom: 'Bfrtip'
        });

        // Populate filter dropdowns
        populateFilters(data);
    }

    // Populate filter dropdowns
    function populateFilters(data) {
        const devices = [...new Set(data.map(item => item.device))];
        const statuses = [...new Set(data.map(item => item.status))];

        const deviceFilter = $('#deviceFilter');
        const statusFilter = $('#statusFilter');

        devices.forEach(device => {
            deviceFilter.append(`<option value="${device}">${device}</option>`);
        });

        statuses.forEach(status => {
            statusFilter.append(`<option value="${status}">${status}</option>`);
        });
    }

    // Apply filters
    function applyFilters() {
        const deviceFilter = $('#deviceFilter').val();
        const statusFilter = $('#statusFilter').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        dataTable.draw();

        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                const device = data[1];
                const status = data[8];
                const date = new Date(data[0].split('/').reverse().join('-'));
                
                const deviceMatch = !deviceFilter || device === deviceFilter;
                const statusMatch = !statusFilter || status === statusFilter;
                const dateMatch = (!startDate || date >= new Date(startDate)) &&
                                (!endDate || date <= new Date(endDate));

                return deviceMatch && statusMatch && dateMatch;
            }
        );
    }

    // Event listeners for filters
    $('#deviceFilter, #statusFilter').on('change', applyFilters);
    $('#startDate, #endDate').on('change', applyFilters);

    // Initialize the table
    initializeDataTable();
});
