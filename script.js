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
        const monTutti = data.data_first_set;
        
        for (const entry of monTutti) {
            for (const impiantiId in entry) {
                const impianto = entry[impiantiId];
                const impiantiName = impianto["IMPIANTI"];
                const devices = impianto["MON-TUTTI"];
                for (const device in devices) {
                    const deviceEntries = devices[device];
                    for (const date in deviceEntries) {
                        const dataEntry = deviceEntries[date];
                        monTuttiData.push({
                            date: date,
                            id: impiantiId,
                            status: dataEntry.stato,
                            device: device,
                            impianti: impiantiName,
                            problems: dataEntry.Problemi,
                            internalNotification: dataEntry['Segnalazione interno '],
                            customerNotification: dataEntry['Segnalazione Cliente'],
                            solution: dataEntry.Soluzione,
                            internalResponsible: dataEntry['Responsabile Interno'],
                            action: dataEntry.Azione
                        });
                    }
                }
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
                { data: 'id' },
                { data: 'status' },
                { data: 'device' },
                { data: 'impianti' },
                { data: 'problems' },
                { data: 'internalNotification' },
                { data: 'customerNotification' },
                { data: 'solution' },
                { data: 'internalResponsible' },
                { data: 'action' }
            ],
            order: [[0, 'desc']],
            pageLength: 25,
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)"
            },
            initComplete: function () {
                // Apply the search
                this.api().columns().every(function () {
                    var that = this;
                    $('input', this.header()).on('keyup change', function () {
                        if (that.search() !== this.value) {
                            that
                                .search(this.value)
                                .draw();
                        }
                    });
                });
            }
        });

        // Event listeners for status buttons
        $('.status-button').on('click', function() {
            $(this).toggleClass('active');
            applyFilters();
        });

        // Event listeners for time period buttons
        $('.time-button').on('click', function() {
            $('.time-button').removeClass('active');
            $(this).addClass('active');
            applyFilters();
        });

        // Clear filter button
        $('#clearFilter').on('click', function() {
            $('#startDate').val('');
            $('#endDate').val('');
            $('.time-button').removeClass('active');
            applyFilters();
        });

        applyFilters();
    }

    // Apply filters
    function applyFilters() {
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();
        const activeStatusButtons = $('.status-button.active').map(function() {
            return $(this).data('status');
        }).get();
        const activeTimeButton = $('.time-button.active').data('period');

        let startPeriodDate, endPeriodDate;

        if (activeTimeButton) {
            const currentDate = new Date();
            switch (activeTimeButton) {
                case 'today':
                    startPeriodDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                    endPeriodDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                    break;
                case 'week':
                    const firstDayOfWeek = new Date(currentDate);
                    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    startPeriodDate = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate());
                    endPeriodDate = new Date(); // Current day
                    break;
                case 'lastWeek':
                    const firstDayOfLastWeek = new Date(currentDate);
                    firstDayOfLastWeek.setDate(currentDate.getDate() - currentDate.getDay() - 7);
                    startPeriodDate = new Date(firstDayOfLastWeek.getFullYear(), firstDayOfLastWeek.getMonth(), firstDayOfLastWeek.getDate());
                    endPeriodDate = new Date(firstDayOfLastWeek.getFullYear(), firstDayOfLastWeek.getMonth(), firstDayOfLastWeek.getDate() + 6);
                    break;
                case 'month':
                    startPeriodDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    endPeriodDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    break;
                case 'year':
                    startPeriodDate = new Date(currentDate.getFullYear(), 0, 1);
                    endPeriodDate = new Date(currentDate.getFullYear(), 11, 31);
                    break;
                case 'all':
                default:
                    startPeriodDate = null;
                    endPeriodDate = null;
                    break;
            }
        }

        $.fn.dataTable.ext.search.pop();
        
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                const dateParts = data[0].split('/');
                const date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                const status = data[2];
                
                const statusMatch = !activeStatusButtons.length || activeStatusButtons.includes(status);
                const dateMatch = (!startDate || date >= new Date(startDate)) &&
                                  (!endDate || date <= new Date(endDate));
                const periodDateMatch = (!startPeriodDate || date >= startPeriodDate) &&
                                        (!endPeriodDate || date <= endPeriodDate);
                
                return statusMatch && dateMatch && periodDateMatch;
            }
        );

        dataTable.draw();
    }

    // Add timestamp and user info
    const timestamp = "2025-02-16 15:20:21"; // Using the provided timestamp
    $('.container').prepend(`
        <div class="info-banner" style="margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            <div>Current Time (UTC): ${timestamp}</div>
            <div>User: bittumon</div>
        </div>
    `);

    // Initialize the table
    initializeDataTable();
});
