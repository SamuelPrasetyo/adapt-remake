<!DOCTYPE html>

<!-- =========================================================
* Sneat - Bootstrap 5 HTML Admin Template - Pro | v1.0.0
==============================================================

* Product Page: https://themeselection.com/products/sneat-bootstrap-html-admin-template/
* Created by: ThemeSelection
* License: You must have a valid license purchased in order to legally use the theme for your project.
* Copyright ThemeSelection (https://themeselection.com)

=========================================================
 -->
<!-- beautify ignore:start -->
<html
  lang="en"
  class="light-style layout-menu-fixed"
  dir="ltr"
  data-theme="theme-default"
  data-assets-path="../assets/"
  data-template="vertical-menu-template-free">

<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />

  <title>ADAPT MAI</title>

  <meta name="description" content="" />
  <meta name="csrf-token" content="{{ csrf_token() }}">


  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="{{asset('/assets/img/logo.png')}}" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
    rel="stylesheet" />

  <!-- Icons. Uncomment required icon fonts -->
  <link rel="stylesheet" href="{{asset('/assets/vendor/fonts/boxicons.css')}}" />

  <!-- Core CSS -->
  <link rel="stylesheet" href="{{asset('/assets/vendor/css/core.css')}}" class="template-customizer-core-css" />
  <link rel="stylesheet" href="{{asset('/assets/vendor/css/theme-default.css')}}" class="template-customizer-theme-css" />
  <link rel="stylesheet" href="{{asset('/assets/css/demo.css')}}" />

  <!-- Vendors CSS -->
  <link rel="stylesheet" href="{{asset('/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css')}}" />

  <link rel="stylesheet" href="{{asset('/assets/vendor/libs/apex-charts/apex-charts.css')}}" />
  <link href="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css" rel="stylesheet" />

  <!-- Page CSS -->

  <!-- Helpers -->
  <script src="{{asset('/assets/vendor/js/helpers.js')}}"></script>

  <!--! Template customizer & Theme config files MUST be included after core stylesheets and helpers.js in the <head> section -->
  <!--? Config:  Mandatory theme config file contain global vars & default theme options, Set your preferred theme option in this file.  -->
  <script src="{{asset('/assets/js/config.js')}}"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
@if(Auth::user() != null)
<style>
  canvas {
    max-width: 600px;
    /* margin: auto; */
    display: block;
  }
</style>

<body>
  <!-- Layout wrapper -->
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
      <!-- Menu -->
      @include('sidebar')
      <!-- / Menu -->

      <!-- Layout container -->
      <div class="layout-page">
        <!-- Navbar -->
        <nav
          class="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
          id="layout-navbar">
          <div class="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
            <a class="nav-item nav-link px-0 me-xl-4" href="javascript:void(0)">
              <i class="bx bx-menu bx-sm"></i>
            </a>
          </div>
          <div class="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
            <span class="fw-bold text-uppercase">Armada Dashboard for Assessment and Performance Tracking</span>
            <ul class="navbar-nav flex-row align-items-center ms-auto">
              <!-- User -->
              <li class="nav-item navbar-dropdown dropdown-user dropdown">
                <a class="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
                  <div class="avatar avatar-online">
                    <img src="{{asset('/assets/img/avatar.jpg')}}" alt class="w-px-40 h-auto rounded-circle" />
                  </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a class="dropdown-item" href="#">
                      <div class="d-flex">
                        <div class="flex-shrink-0 me-3">
                          <div class="avatar avatar-online">
                            <img src="{{asset('/assets/img/avatar.jpg')}}" alt class="w-px-40 h-auto rounded-circle" />
                          </div>
                        </div>
                        <div class="flex-grow-1">
                          <span class="fw-semibold d-block">{{Auth::user()->name}}</span>
                          <small class="text-muted">{{Auth::user()->type}}</small>
                        </div>
                      </div>
                    </a>
                  </li>
                  <li>
                    <div class="dropdown-divider"></div>
                  </li>
                  <li>
                    <a style="cursor:pointer" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#changepassword">
                      <i class="bx bx-key me-2"></i>
                      <span class="align-middle">Change Password</span>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="{{ route('logout') }}" onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                      <i class="bx bx-power-off me-2"></i>
                      <span class="align-middle">Log Out</span>
                    </a>
                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                      {{ csrf_field() }}
                    </form>
                  </li>
                </ul>
              </li>
              <!--/ User -->
            </ul>
          </div>
        </nav>

        <!-- / Navbar -->

        <!-- Content wrapper -->
        <div class="content-wrapper">
          <!-- Content -->
          @yield('content')
          <!-- Toast Notification Area -->
          <div id="toast-container" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;">
            @if (session()->has('errors'))
            <div class="toast show bg-danger" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="toast-header bg-white">
                <strong class="me-auto text-danger">Failed</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
              <div class="toast-body">
                {{ session('errors') }}
              </div>
            </div>
            @endif
          </div>
          <!-- Modal -->
          <div class="modal fade" id="changepassword" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">

                  <h5 class="modal-title" id="exampleModalLabel">Change Password</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{route('user.change_password',Auth::user()->id)}}" method="POST">
                  @csrf
                  <div class="modal-body">
                    <label class="mb-2">Kata sandi lama: </label>
                    <div class="form-group">
                      <input type="password" required placeholder="kata sandi lama"
                        class="form-control" name="password_lama">
                    </div>
                    <label class="mb-2">Kata sandi baru: </label>
                    <div class="form-group">
                      <input type="password" required placeholder="kata sandi baru"
                        class="form-control" name="password">
                    </div>
                    <label class="mb-2">Konfirmasi Kata sandi: </label>
                    <div class="form-group">
                      <input type="password" required placeholder="kata sandi"
                        class="form-control" name="password2">
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-light-secondary"
                      data-bs-dismiss="modal">
                      <i class="bx bx-x d-block d-sm-none"></i>
                      <span class="d-none d-sm-block">Close</span>
                    </button>
                    <button class="btn btn-primary ml-1" type="submit">Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          @include('sweetalert::alert')
          <!-- / Content -->
          <!-- Footer -->
          <footer class="content-footer footer bg-footer-theme">
            <div class="container-xxl d-flex flex-wrap justify-content-center flex-md-row flex-column">
              <div class="mb-2 pb-0 mt-2">
                2024 © IT Mekar Armada Investama
              </div>
            </div>
          </footer>
          <!-- / Footer -->

          <div class="content-backdrop fade"></div>

          <!-- Overlay -->
          <div class="layout-overlay layout-menu-toggle"></div>
        </div>

        <!-- Core JS -->
        <!-- build:js assets/vendor/js/core.js -->
        <script src="{{asset('/assets/vendor/libs/jquery/jquery.js')}}"></script>
        <script src="{{asset('/assets/vendor/libs/popper/popper.js')}}"></script>
        <script src="{{asset('/assets/vendor/js/bootstrap.js')}}"></script>
        <script src="{{asset('/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js')}}"></script>

        <script src="{{asset('/assets/vendor/js/menu.js')}}"></script>
        <!-- endbuild -->

        <!-- Vendors JS -->
        <script src="{{asset('/assets/vendor/libs/apex-charts/apexcharts.js')}}"></script>

        <!-- Main JS -->
        <script src="{{asset('/assets/js/main.js')}}"></script>

        <!-- Page JS -->
        <script src="{{asset('/assets/js/dashboards-analytics.js')}}"></script>

        <!-- Place this tag in your head or just before your close body tag. -->
        <script async defer src="https://buttons.github.io/buttons.js"></script>
        @yield('addon-script')
        <!-- DataTables -->
        <script type="text/javascript" src="https://cdn.datatables.net/1.12.1/js/jquery.dataTables.min.js"></script>

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.0/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/2.0.8/css/dataTables.bootstrap5.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/2.1.8/css/dataTables.dataTables.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/buttons/3.1.2/css/buttons.dataTables.css">

        <script type="text/javascript" src="https://cdn.datatables.net/2.0.8/js/dataTables.js"></script>
        <script type="text/javascript" src="https://cdn.datatables.net/2.0.8/js/dataTables.bootstrap5.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert/2.1.0/sweetalert.min.js"></script>

        <script type="text/javascript" src="https://cdn.datatables.net/buttons/3.1.1/js/dataTables.buttons.js"></script>
        <script type="text/javascript" src="https://cdn.datatables.net/buttons/3.1.1/js/buttons.dataTables.js"></script>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <script type="text/javascript" src="https://cdn.datatables.net/buttons/3.1.1/js/buttons.html5.min.js"></script>

        <script src="https://cdn.ckeditor.com/ckeditor5/40.0.0/classic/ckeditor.js"></script>
        <!-- <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> -->
        <script src="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</body>
@else
<script>
  window.location = "{{ route('login.index') }}";
</script>
<?php exit; ?>
@endif

</html>
<script>
  $(document).ready(function() {
    var url = window.location.href.split("/");
    switch (url[3]) {
      case 'dashboard':
        $("#dashboard").addClass('active');
        break;
      case 'user':
        $("#user").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'divisi':
        $("#divisi").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'departemen':
        $("#departemen").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'batch':
        $("#batch").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'nilai':
        $("#nilai").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'pertanyaan':
        $("#pertanyaan").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'week':
        $("#week").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'kader':
        $("#kader").addClass('active');
        $("#master").addClass('active open');
        break;
      case 'jawaban':
        $("#jawaban").addClass('active');
        $("#modul").addClass('active open');
        break;
      case 'feedback':
        $("#feedback").addClass('active');
        $("#modul").addClass('active open');
        break;
      case 'learning-growth':
        $("#learning_growth").addClass('active');
        $("#report").addClass('active open');
        break;
      case 'learning-index':
        $("#learning_growth").addClass('active');
        $("#report").addClass('active open');
        break;
      case 'ojt-index':
        $("#ojt").addClass('active');
        $("#report").addClass('active open');
        break;
      case 'ojt-monitoring':
        $("#ojt").addClass('active');
        $("#report").addClass('active open');
        break;
      case 'activity-log':
        $("#activity_log").addClass('active');
        $("#report").addClass('active open');
        break;
      default:
        break;
    }
  });
</script>