<?php

class View {

	public static function load($_name, $_data = []) {
		$_name = str_replace('.php', '', $_name);
		$_tpl = file_get_contents(VIEWS.$_name.'.php');

		$_tpl = str_replace('{{', '<?=', $_tpl);
		$_tpl = str_replace('}}', '?>', $_tpl);

		extract($_data);

		echo eval('?>'.$_tpl.'<?');
	}

}