<aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme">
    <div class="app-brand demo">
        <a href="index.html" class="app-brand-link">
            <h5 class="mt-2"><span class="card-header fw-bold">Dashboard MT</span></h5>
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
    </ul>
</aside>