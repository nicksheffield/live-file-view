<?php

Route::get('/', 'Site->index');

Route::fallback(ERRORS.'404.php');