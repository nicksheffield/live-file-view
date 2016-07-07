<?php

# This file is a place you can put any custom code
# you may need that none of the libraries provide.
#
# Any functions you declare here will be accessible
# anywhere in your controllers and views.

function url($url) {
	$base = str_replace($_SERVER['DOCUMENT_ROOT'], '', $_SERVER['SCRIPT_FILENAME']);
	$base = str_replace('index.php', '', $base);

	if(strpos($url, '/') === 0) {
		$url = substr($url, 1);
	}

	return $base.$url;
}

function style($filename) {
	return '<link rel="stylesheet" href="'.url($filename).'">';
}

function script($filename) {
	return '<script src="'.url($filename).'"></script>';
}

function image($filepath, $extras = []) {
	$extras = Form::make_attrs($extras);
	return '<img src="'.url($filepath).'" '.$extras.'>';
}