@extends('app')
@section('content')
<div class="container-xxl flex-grow-1 container-p-y container-p-x">
    <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="{{route('weekly.index')}}">OJT Monitoring</a></li>
            <li class="breadcrumb-item active" aria-current="page">{{$title['nama_kader']}}</li>
        </ol>
    </nav>
    <div class="row">
        <div class="col-lg-12 mb-4 order-0">
        <button id="downloadPdf" class="btn btn-sm btn-primary mb-2">Export to PDF</button>
            <div class="card" style="background-color:#FFF;" id="reportOjt">
            <input type="text" id="nama_kaderojt" hidden value="{{$title['nama_kader']}}">
            <input type="text" id="ojt" hidden value="{{$title['ojt']}}">
                <div class="card-body p-4 pt-3">
                    <div class="row">
                        <div class="col-2 text-center" style="border: #000 2px solid;">
                            <img class="m-2" src="{{asset('/assets/img/logomai.png')}}" width="100" height="50" alt="">
                        </div>
                        <div class="col-8" style="border-top: #000 2px solid;border-bottom: #000 2px solid;">
                            <h5 class="m-0" style="position: relative; top:20%; left:-2%;text-align:center"><b>REPORT OJT {{$title['ojt']}} BATCH {{$title['batch']}} <br>MONITORING SUMMARY BY CHC MAI</b></h5>
                        </div>
                        <div class="col-2 text-center p-0" style="border: #000 2px solid;">
                            <img class="m-0 p-0" src="{{asset('/assets/img/NAG.png')}}" width="150" height="75" alt="">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 text-center" style="border-left: #000 2px solid;border-right: #000 2px solid;border-bottom: #000 2px solid;">
                            <div class="row">
                                <div class="col-6">
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>PERIOD</b> : OJT {{$title['ojt']}}</p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>MANTEE NAME</b> : {{strtoupper($title['nama_kader'])}}</p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>MENTOR NAME</b> : 
                                    @if(is_array($title['nama_mentor']))
                                        @foreach($title['nama_mentor'] as $key => $nm)
                                            @if($key !== array_key_last($title['nama_mentor']))
                                                {{strtoupper($nm)}},
                                            @else
                                                {{strtoupper($nm)}}
                                            @endif
                                        @endforeach
                                    @else
                                        {{strtoupper($title['nama_mentor'])}}
                                    @endif
                                    </p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>MT BATCH</b> : {{$title['batch']}}</p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>IQ</b> : {{$title['iq']}} </p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>INCH</b> : {{$title['ipk']}}</p>
                                </div>
                                <div class="col-5 offset-1">
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>DIVISION</b> : {{$title['divisi']}}</p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>DEPARTEMENT</b> : {{$title['departemen']}}</p>
                                    <p class="m-0" style="text-align: left; font-size:14px"><b>BUSSINESS UNIT</b> : {{$title['bu']}}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-12 text-center" style="border: #000 2px solid; background-color:skyblue">
                            <h6 class="m-2">OVERVIEW</h6>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-6">
                            <div class="row">
                                <div class="col-12 text-center" style="border: #000 1px solid; background-color:skyblue">
                                    <h6 class="m-2">OJT {{$title['ojt']}} PERFORMANCE RESULTS</h6>
                                </div>
                            </div>
                            @if($data != [])
                            <div class="row">
                                <div class="col-12 p-0">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:1.5vh; text-align:center">NO</th>
                                                <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:1.5vh; text-align:center">ASSESSMENT POINT</th>
                                                @foreach($week_arr as $wa)
                                                <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:1.5vh; text-align:center">W{{$wa}}</th>
                                                @endforeach
                                                <th style="font-size: 9px;border:1px black solid;background-color:white;padding-bottom:1.5vh; text-align:center">AVE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @php $no=1; @endphp
                                            @foreach($pertanyaans as $val)
                                            <tr>
                                                <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$no++}}</td>
                                                <td style="font-size: 11px;background-color:#E5E4E2;text-align:left;border:1px black solid">{{strip_tags($val->nama_pertanyaan)}}</td>
                                                @php $avg_pertanyaan = 0;@endphp

                                                @for($i = 0; $i < count($data[strip_tags($val->nama_pertanyaan)]); $i++)
                                                    <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$data[strip_tags($val->nama_pertanyaan)][$week_arr[$i]]}}</td>
                                                    @php $avg_pertanyaan += $data[strip_tags($val->nama_pertanyaan)][$week_arr[$i]];@endphp
                                                    @endfor
                                                    <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{round($avg_pertanyaan/6, 2)}}</td>
                                            </tr>
                                            @endforeach
                                            <tr>
                                                <td colspan="2" style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">AVE SCORE</td>
                                                @foreach($week_arr as $i)
                                                <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$avg_week[$i] ?? 0}}</td>
                                                @endforeach
                                                <td rowspan="3" style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid"></td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">LEARNING GROWTH</td>
                                                @foreach($week_arr as $i)
                                                <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$data_lg[$i] ?? 0}}</td>
                                                @endforeach
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">BATAS MINIMUM</td>
                                                @foreach($week_arr as $i)
                                                <td style="font-size: 11px;background-color:#E5E4E2;text-align:center;border:1px black solid">{{$data_kkm[$i] ?? 0}}</td>
                                                @endforeach
                                                
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            @endif
                        </div>
                        <div class="col-6 text-center">
                            <canvas id="myLineChart"></canvas>
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
    document.getElementById('downloadPdf').addEventListener('click', async () => {
        const {
            jsPDF
        } = window.jspdf; // Use the jsPDF instance
        const doc = new jsPDF('p', 'pt', 'a4'); // Portrait, points, A4 size

        // Select the content to be converted to PDF
        const reportPage = document.getElementById('reportOjt');

        // Use html2canvas to capture content as image
        const canvas = await html2canvas(reportPage);
        const imgData = canvas.toDataURL('image/png');

        // Add image to PDF
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const namaKader = $('#nama_kaderojt').val();
        const ojt = $('#ojt').val();
        doc.save('OJT'+ojt+'_MonitoringReport_'+namaKader+'.pdf'); // Save the PDF
    });
    
    var ctx = document.getElementById('myLineChart').getContext('2d');
    var week = <?php echo $week; ?>;
    
    var avg = <?php echo $avg; ?>;
    var lg = <?php echo $learningG; ?>;
    var kkm = <?php echo $kkm; ?>;
    console.log(avg,lg,kkm,week);
    


    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Ave Score',
                    data: avg,
                    borderColor: 'rgb(50, 205, 50)',
                    backgroundColor: 'rgb(50, 205, 50)',
                    borderWidth: 3,
                    tension: 0.4,
                }, 
                {
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
    $(document).ready(function() {

        $('#example').DataTable({
            // scrollY:        "100%",
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