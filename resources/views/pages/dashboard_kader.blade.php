@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
            <!-- <button id="downloadPdf" class="btn btn-sm btn-primary mb-2">Export to PDF</button> -->
            <input type="text" id="nama_kader" hidden value="{{$title['nama_kader']}}">
            <div class="card" style="background-color:#E5E4E2;" id="reportPage">
                <div class="row m-0 pt-1 pb-0" style="background-color: skyblue;border-radius:6px 6px 0px 0px">
                    <h5 class="text-center">DASHBOARD LEARNING GROWTH (DEVELOPMENT)</h5>
                </div>
                <div class="card-body">
                    <!-- <div class="row">
                        <div class="col-8">
                            <div class="row">
                                <div class="col-3">
                                    Nama
                                </div>
                                <div class="col-8">
                                    : {{$title['nama_kader']}}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-3">
                                    Divisi
                                </div>
                                <div class="col-8">
                                    : {{$title['divisi']}}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-3">
                                    Departemen
                                </div>
                                <div class="col-8">
                                    : {{$title['departemen']}}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-3">
                                    BU
                                </div>
                                <div class="col-8">
                                    : {{$title['bu']}}
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="row">
                                <p class="text-center mb-1" style="font-size:15px;font-weight: 500;">Aspek Penilaian:</p>
                            </div>
                            <div class="row">
                                <div class="col-5 offset-1" style="background-color: #4169E1;border-radius:6px">
                                    <p class="mt-2 mb-1 text-white text-center" style="font-size:13px;font-weight: 450;">Routine Job</p>
                                    <hr class="m-0">
                                    <p class="mt-1 mb-2 text-white text-center" style="font-size:13px;font-weight: 450;">Assignment</p>
                                </div>
                                &nbsp;
                                <div class="col-5" style="font-size:13px;background-color: #4169E1;border-radius:6px">
                                    <p class="mt-2 mb-1 text-white text-center" style="font-size:13px;font-weight: 450;">SOP</p>
                                    <hr class="m-0">
                                    <p class="mt-1 mb-2 text-white text-center" style="font-size:13px;font-weight: 450;">Project</p>
                                </div>
                            </div>
                        </div>
                    </div> -->
                    <br>
                    <div class="row">
                        <div class="col-4">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:2.5vh">Week</th>
                                        <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:2.5vh">Ave Score</th>
                                        <th style="font-size: 9px;border:1px black solid;background-color:white;">Learning <br>growth</th>
                                        <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:2.5vh">Batas Normal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($reports as $report)
                                    <tr>
                                        <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$report->week}}</td>
                                        <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$report->avg}}</td>
                                        <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$data_lg[$report->week]}}</td>
                                        <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">7</td>
                                    </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                        <div class="col-8">
                            <div class="card">
                                <div class="card-body">
                                    <canvas id="myLineChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
@section('addon-script')


<script type="text/javascript">
   

    var ctx = document.getElementById('myLineChart').getContext('2d');
    var week = <?php echo $week; ?>;
    var avg = <?php echo $avg; ?>;
    var lg = <?php echo $learningG; ?>;
    var kkm = <?php echo $kkm; ?>;
    console.log(avg, lg, kkm);



    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                    label: 'Ave Score',
                    data: avg,
                    borderColor: 'rgb(50, 205, 50)',
                    backgroundColor: 'rgb(50, 205, 50)',
                    borderWidth: 3,
                    tension: 0.4,
                    name: 'TIME SPENT (BIWEEK)'
                }, {
                    label: 'Learning growth',
                    data: lg,
                    borderColor: 'rgb(255, 191, 0)',
                    backgroundColor: 'rgb(255, 191, 0)',
                    borderWidth: 3,
                    tension: 0.4,
                },
                {
                    label: 'Batas Normal',
                    data: kkm,
                    borderColor: 'rgb(169, 169, 169)',
                    backgroundColor: 'rgb(169, 169, 169)',
                    borderWidth: 3,
                    tension: 0.4,
                },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'TIME SPENT (BIWEEK)',
                    }
                },
            },
            scales: {
                y: {
                    beginAtZero: true
                },
            },
        }
    });
    document.getElementById('exportPdf').addEventListener('click', () => {
        const canvas = document.getElementById('myLineChart');
        const image = canvas.toDataURL('image/png'); // Konversi ke base64
        var nikValue = $('#nik').val();

        fetch('/export-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    image,
                    nik: nikValue
                })
            })
            .then(response => response.blob())
            .then(blob => {

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'chart.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            });
    });
    $(document).ready(function() {

        $('#example').DataTable({
            scrollY:        "100%",
            scrollCollapse: true,
            paging: true,
            aaSorting: [],
            "lengthMenu": [10, 25, 50, 100, ],
        });

    });
    $('.show_confirm').click(function(event) {

        var form = $(this).closest("form");

        var name = $(this).data("name");

        event.preventDefault();

        swal({

                title: `Apakah anda yakin ingin menghapus data ini ?`,

                icon: "warning",

                buttons: true,

                dangerMode: true,

            })

            .then((willDelete) => {

                if (willDelete) {

                    form.submit();

                }

            });

    });
</script>
@endsection