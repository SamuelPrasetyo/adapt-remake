<!DOCTYPE html>
<html>

<head>
    <title>Chart Export</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        /* Ensure the page fits A4 dimensions */
        @page {
            size: A4;
            margin: 20mm;
        }

        /* General body styling */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        /* Ensure container aligns properly for A4 */
        .container-xxl {
            max-width: 210mm;
        }

        /* Card layout adjustments */
        .card {
            border: none;
            page-break-inside: avoid;
        }

        /* Table styling for printing */
        .table th, .table td {
            font-size: 10px;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
        }

        /* Chart adjustments */
        img {
            max-width: 100%;
            height: auto;
        }

        /* Print-specific styles */
        @media print {
            body {
                margin: 0;
                color: #000;
                background-color: #fff;
            }

            .no-print {
                display: none;
            }

            .table th, .table td {
                font-size: 9px;
            }
        }
    </style>
</head>

<body>
    <div class="container-xxl py-4">
        <!-- Card Header -->
        <div class="card mb-4" style="background-color:#E5E4E2;">
            <div class="row m-0 py-2" style="background-color: skyblue; border-radius:6px 6px 0 0;">
                <h5 class="text-center mb-0">LEARNING GROWTH (DEVELOPMENT)</h5>
            </div>
            <!-- Card Body -->
            <div class="card-body">
                <!-- Personal Info and Assessment Section -->
                <div class="row g-3">
                    <!-- Personal Info -->
                    <div class="col-md-8">
                        <div class="mb-2 row">
                            <div class="col-3 fw-bold">Nama</div>
                            <div class="col-9">: {{$title['nama_kader']}}</div>
                        </div>
                        <div class="mb-2 row">
                            <div class="col-3 fw-bold">Divisi</div>
                            <div class="col-9">: {{$title['divisi']}}</div>
                        </div>
                        <div class="mb-2 row">
                            <div class="col-3 fw-bold">Departemen</div>
                            <div class="col-9">: {{$title['departemen']}}</div>
                        </div>
                        <div class="row">
                            <div class="col-3 fw-bold">BU</div>
                            <div class="col-9">: {{$title['bu']}}</div>
                        </div>
                    </div>
                    <!-- Assessment Info -->
                    <div class="col-md-4">
                        <p class="text-center mb-2 fw-bold">Aspek Penilaian:</p>
                        <div class="d-flex justify-content-between">
                            <div class="text-white text-center px-2 py-1" style="background-color: #4169E1; border-radius: 6px;">
                                Routine Job
                                <hr class="m-1 bg-white">
                                Assignment
                            </div>
                            <div class="text-white text-center px-2 py-1" style="background-color: #4169E1; border-radius: 6px;">
                                SOP
                                <hr class="m-1 bg-white">
                                Project
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Table and Chart Section -->
                <div class="row g-3 mt-4">
                    <!-- Table -->
                    <div class="col-md-4">
                        <table class="table table-bordered text-center">
                            <thead>
                                <tr class="table-light">
                                    <th style="font-size: 11px;">Week</th>
                                    <th style="font-size: 11px;">Ave Score</th>
                                    <th style="font-size: 11px;">Learning Growth</th>
                                    <th style="font-size: 11px;">Batas Normal</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($reports as $report)
                                <tr>
                                    <td style="font-size: 11px; background-color:#E5E4E2;">{{$report->week}}</td>
                                    <td style="font-size: 11px; background-color:#E5E4E2;">{{$report->avg}}</td>
                                    <td style="font-size: 11px; background-color:#E5E4E2;">{{$data_lg[$report->week]}}</td>
                                    <td style="font-size: 11px; background-color:#E5E4E2;">7</td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    <!-- Chart -->
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-body text-center">
                                <img src="{{$image}}" alt="Chart" class="img-fluid" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
