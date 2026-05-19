<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        //
        Gate::define('isAdmin', function($user) {
            return $user->type == 'Admin';
         });
        Gate::define('isKader', function($user) {
            return $user->type == 'Kader';
         });
        Gate::define('isMentor', function($user) {
            return $user->type == 'Mentor';
         });
        Gate::define('isAll', function($user) {
            return $user->type != '';
         });

         Gate::define('isUser', function($user) {
            return $user->type != 'Admin';
         });

         Gate::define('isAdmin&Mentor', function($user) {
            return $user->type != 'Kader';
         });

         Gate::define('isAdmin021', function($user) {
            return $user->type == 'Admin' && $user->company_code == '021';
         });

         Gate::define('canMentorDashboard', function($user) {
            return ($user->type == 'Admin' && $user->company_code == '021')
                || $user->type == 'Mentor';
         });
    }
}
