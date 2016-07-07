<?php

# Change this path to match wherever your app folder is
define('APP',         'app/');

define('CONTROLLERS', APP.'controllers/');
define('ERRORS',      APP.'errors/');
define('LIBRARIES',   APP.'libraries/');
define('MODELS',      APP.'models/');
define('VIEWS',       APP.'views/');

# Autoload the controllers, libraries and models
foreach(glob(LIBRARIES.'*.php') as $file) {
	require_once $file;
}

foreach(glob(MODELS.'*.php') as $file) {
	require_once $file;
}

foreach(glob(CONTROLLERS.'*.php') as $file) {
	require_once $file;
}

require APP.'functions.php';
require APP.'routes.php';