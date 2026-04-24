@extends('app')
@section('content')
<style>
    .card {
        border-radius: 12px;
    }

    .progress {
        height: 6px;
    }
</style>

<div class="container-xxl flex-grow-1 container-p-y">

    {{-- HEADER --}}
    <div class="card mb-4">
        <div class="card-body d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <div>
                    <h5 class="mb-0">Dashboard</h5>
                    <small class="text-muted">Talent & Development · ADAPT Program</small>
                </div>
            </div>

            <div class="d-flex text-center">
                <div class="mx-3">
                    <h4 class="mb-0 text-primary">48</h4>
                    <small>Total kader</small>
                </div>
                <div class="mx-3">
                    <h4 class="mb-0 text-primary">4</h4>
                    <small>Mentor aktif</small>
                </div>
                <div class="mx-3">
                    <h4 class="mb-0 text-primary">24</h4>
                    <small>Modul tersedia</small>
                </div>
                <div class="mx-3">
                    <h4 class="mb-0 text-danger">11</h4>
                    <small>Dok. pending</small>
                </div>
            </div>
        </div>
    </div>

    {{-- SUMMARY --}}
    <div class="row mb-4">
        <div class="col-md-3">
            <div class="card p-3">
                <h6>Kader aktif</h6>
                <h3>48</h3>
                <small class="text-muted">3 batch berjalan</small>
                <div class="progress mt-2">
                    <div class="progress-bar bg-success" style="width:100%"></div>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card p-3">
                <h6>Dokumen masuk</h6>
                <h3>127</h3>
                <small class="text-muted">11 pending review</small>
                <div class="progress mt-2">
                    <div class="progress-bar bg-primary" style="width:70%"></div>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card p-3">
                <h6>Modul terunduh</h6>
                <h3>384</h3>
                <small class="text-muted">Bulan ini</small>
                <div class="progress mt-2">
                    <div class="progress-bar bg-primary" style="width:65%"></div>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card p-3">
                <h6>IDP belum lengkap</h6>
                <h3 class="text-danger">24</h3>
                <small class="text-muted">dari 48 kader</small>
                <div class="progress mt-2">
                    <div class="progress-bar bg-danger" style="width:50%"></div>
                </div>
            </div>
        </div>
    </div>

    {{-- PROGRESS & MENTOR --}}
    <div class="row mb-4">
        <div class="col-md-6">
            <div class="card p-3">
                <h6>Progress kader per departemen</h6>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Keuangan</span>
                        <span>75%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-success" style="width:75%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Marketing</span>
                        <span>60%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-primary" style="width:60%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Produksi</span>
                        <span>45%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-info" style="width:45%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>HR</span>
                        <span>30%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-danger" style="width:30%"></div>
                    </div>
                </div>

            </div>
        </div>

        <div class="col-md-6">
            <div class="card p-3">
                <h6>Weekly monitoring mentor</h6>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Hendra Wijaya</span>
                        <span>3/3</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-success" style="width:100%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Lisa Nurhayati</span>
                        <span>3/4</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-success" style="width:75%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Rizky Andika</span>
                        <span>1/3</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-warning" style="width:30%"></div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="d-flex justify-content-between">
                        <span>Siti Wulandari</span>
                        <span>0/2</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-secondary" style="width:10%"></div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    {{-- MODULE --}}
    <div class="card p-3 mb-4">
        <h6>Kelola modul per kategori</h6>
        <div class="row mt-3 text-center">
            <div class="col-md-3">
                <div class="p-3 bg-light rounded">
                    <h6>Leadership</h6>
                    <h3>10</h3>
                    <small>Semua kader</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="p-3 bg-light rounded">
                    <h6>Marketing & Sales</h6>
                    <h3>4</h3>
                    <small>Functional</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="p-3 bg-light rounded">
                    <h6>Finance & Adm</h6>
                    <h3>4</h3>
                    <small>Functional</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="p-3 bg-light rounded">
                    <h6>Production</h6>
                    <h3>3</h3>
                    <small>Functional</small>
                </div>
            </div>
        </div>
    </div>

    {{-- FILE --}}
    <div class="card p-3">
        <h6>Upload terbaru — kader & mentor</h6>

        <ul class="list-group list-group-flush mt-3">
            <li class="list-group-item d-flex justify-content-between">
                <span>PostActivity_Training_Delta_Ahmad.xlsx</span>
                <button class="btn btn-sm btn-outline-primary">Unduh</button>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>PostActivity_CommunicationSkill_Hendra.pptx</span>
                <button class="btn btn-sm btn-outline-primary">Unduh</button>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>PostActivity_DELTA_Sari.docx</span>
                <button class="btn btn-sm btn-outline-primary">Unduh</button>
            </li>
        </ul>
    </div>

</div>

@endsection