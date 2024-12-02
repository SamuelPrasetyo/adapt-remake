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
        @canany('isAdmin')
        <li class="menu-item" id="master">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
                <i class="menu-icon tf-icons bx bx-grid"></i>
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
                        <div>Departemen</div>
                    </a>
                </li>
                <li class="menu-item" id="batch">
                    <a href="{{route('batch.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-collection"></i>
                        <div>Batch</div>
                    </a>
                </li>
                <li class="menu-item" id="nilai">
                    <a href="{{route('nilai.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-cube-alt"></i>
                        <div>Nilai</div>
                    </a>
                </li>
                <li class="menu-item" id="pertanyaan">
                    <a href="{{route('pertanyaan.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-file"></i>
                        <div>Pertanyaan</div>
                    </a>
                </li>
                <li class="menu-item" id="week">
                    <a href="{{route('week.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-time"></i>
                        <div>Week</div>
                    </a>
                </li>
                <li class="menu-item" id="kader">
                    <a href="{{route('kader.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-detail"></i>
                        <div>Kader</div>
                    </a>
                </li>
            </ul>
        </li>
        @endcanany
        <li class="menu-item" id="modul">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
                <i class="menu-icon tf-icons bx bx-layout"></i>
                <div data-i18n="Layouts">Modul</div>
            </a>
            <ul class="menu-sub">
                @canany('isAdmin')
                <li class="menu-item" id="activity_log">
                    <a href="{{route('activity.log')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-cog"></i>
                        <div data-i18n="Activity Log">Activity Log</div>
                    </a>
                </li>
                <li class="menu-item" id="jawaban">
                    <a href="{{route('jawaban.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-file"></i>
                        <div data-i18n="Jawaban">Feedback</div>
                    </a>
                </li>
                @endcanany
                @canany(['isMentor','isKader'])
                <li class="menu-item" id="feedback">
                    <a href="{{route('feedback.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-archive-in"></i>
                        <div data-i18n="Feedback">Feedback</div>
                    </a>
                </li>
                @endcanany
            </ul>
        </li>
        @canany(['isAdmin','isMentor'])

        <li class="menu-item" id="report">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
                <i class="menu-icon tf-icons bx bx-file"></i>
                <div data-i18n="Layouts">Report</div>
            </a>
            <ul class="menu-sub">
                <li class="menu-item" id="learning_growth">
                    <a href="{{route('learning.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-detail"></i>
                        <div data-i18n="learning_growth">Learning Growth</div>
                    </a>
                </li>
                @canany(['isAdmin'])
                <li class="menu-item" id="ojt">
                    <a href="{{route('weekly.index')}}" class="menu-link">
                        <i class="menu-icon tf-icons bx bxs-chart"></i>
                        <div data-i18n="ojt">OJT Monitoring</div>
                    </a>
                </li>
                @endcanany
            </ul>
        </li>
        @endcanany

    </ul>
</aside>