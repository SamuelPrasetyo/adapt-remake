<aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme">
    <div class="app-brand demo justify-content-center">
        <a href="index.html" class="app-brand-link">
            <h5 class="mt-2"><span class="card-header fw-bold">ADAPT</span></h5>
        </a>

        <a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
            <i class="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
    </div>

    <div class="menu-inner-shadow"></div>

    <ul class="menu-inner py-1">
        <!-- Dashboard -->
        <li class="menu-item" id="dashboard">
            <a href="{{route('dashboard.index')}}" class="menu-link">
                <i class="menu-icon tf-icons bx bx-home-circle"></i>
                <div data-i18n="Analytics">Dashboard</div>
            </a>
        </li>
        <li class="menu-item" id="master">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
                <i class="menu-icon tf-icons bx bx-layout"></i>
                <div data-i18n="Layouts">Master</div>
            </a>
            <ul class="menu-sub">
                <li class="menu-item" id="user">
                    <a href="{{route('user.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-user"></i>
                        <div data-i18n="User">User</div>
                    </a>
                </li>
                <li class="menu-item" id="divisi">
                    <a href="{{route('divisi.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-institution"></i>
                        <div data-i18n="Divisi">Divisi</div>
                    </a>
                </li>
                <li class="menu-item" id="departemen">
                    <a href="{{route('departemen.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-building"></i>
                        <div data-i18n="Departemen">Departemen</div>
                    </a>
                </li>
                <li class="menu-item" id="batch">
                    <a href="{{route('batch.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-collection"></i>
                        <div data-i18n="Departemen">Batch</div>
                    </a>
                </li>
                <li class="menu-item" id="nilai">
                    <a href="{{route('nilai.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-cube-alt"></i>
                        <div data-i18n="Departemen">Nilai</div>
                    </a>
                </li>
                <li class="menu-item" id="pertanyaan">
                    <a href="{{route('pertanyaan.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-file"></i>
                        <div data-i18n="Departemen">Pertanyaan</div>
                    </a>
                </li>
                <li class="menu-item" id="week">
                    <a href="{{route('week.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-time"></i>
                        <div data-i18n="Departemen">Week</div>
                    </a>
                </li>
            </ul>
        </li>

    </ul>
</aside>