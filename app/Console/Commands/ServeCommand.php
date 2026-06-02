<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ServeCommand extends Command
{
    protected $signature = 'serve
                            {--host=127.0.0.1 : The host address to serve the application on}
                            {--port=8000 : The port to serve the application on}';

    protected $description = 'Serve the application on the PHP development server';

    public function handle()
    {
        $host = $this->option('host');
        $port = $this->option('port');

        $this->info("Starting Laravel development server: http://{$host}:{$port}");

        $process = new Process(
            ['php', '-S', "{$host}:{$port}", '-t', 'public'],
            base_path()
        );

        $process->setTimeout(null);
        $process->setTty(false);

        $process->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });
    }
}
