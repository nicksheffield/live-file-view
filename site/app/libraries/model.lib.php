<?php

/**
*	
*	General model class
*
*	@uses Config, for db details. Database, for db connection
*
*	@version 4.0
*	@author  Nick Sheffield
*
*/

namespace App\Model;

require_once 'config.lib.php';
require_once 'database.lib.php';
require_once 'xss.lib.php';

use App\Database;
use App\Config;
use App\XSS;

class Model {

	public    $fields        = array();
	public    $primary_key   = 'id';
	public    $table         = '';
	public    $data          = array();
	protected $db            = null;
	protected $check_fields  = true;

	/**
	*
	*	This method is called automatically when this class is constructed.
	*
	*	@param  string  $table          The table that this model is supposed to represent
	*	@param  boolean $check_fields   Whether or not to create a field whitelist of this table
	*
	*	@return $this
	*
	*/
	function __construct($table = '', $check_fields = true) {
		
		$this->check_fields = $check_fields;
		$this->db = new Database(Config::$database);
		
		if($table) {
			$this->table = $table;
		}
		
		if($this->getTable() && $this->check_fields) {
			$this->load_fields();
		}
		
		return $this;
	}


	/**
	*
	*	This method automatically triggers whenever we try to get a property
	*	from this object.
	*
	*	Instead of actually getting a property from this object, it instead pulls
	*	it from the data property, which is an array.
	*
	*	@param  string $var The property being requested
	*
	*	@return mixed  The value of the property being requested, or false if the property doesn't exist
	*
	*/
	function __get($var) {
		if(method_exists($this, $var)) {
			return $this->$var()->get();
		}else if(isset($this->data[$var])) {
			return XSS::filter($this->data[$var]);
		}else{
			return false;
		}
	}

	/**
	*
	*	This method automatically triggers whenever we try to set a property
	*	from this object.
	*
	*	Instead of actually setting a property on this object, it instead modifies
	*	or adds the value in the data property, which is an array.
	*
	*	It only works if the key ($var) exists in the fields property, which is an
	*	array of all the possible fields in this database table. If that property
	*	didn't exist, it just returns false, thus, failing silently.
	*
	*	@param  string  $var The name of the property being changed
	*	@param  string  $val The value of the property being changed
	*
	*	@return boolean Whether the property existed or not.
	*
	*/
	function __set($var, $val) {
		if($var == 'primary_key') {
			$this->primary_key = $val;
		}

		if($this->check_fields) {
			if(in_array($var, $this->fields)) {
				$this->data[$var] = $val;
				return true;
			}else{
				return false;
			}
		}else{
			$this->data[$var] = $val;
			return true;
		}
	}
	
	/**
	*
	*
	*/
	public function load_fields() {
		$this->fields = Field_Provider::table($this->getTable(), $this->db);
		
		return $this;
	}
	
	/**
	*
	*
	*/
	public function set_table($table) {
		$this->table = $table;
		
		return $this;
	}

	/**
	*
	*	Load information from the database table
	*
	*	@param  int   $id The value of the id field in the table
	*
	*	@return $this
	*
	*/
	public function load($data) {
			
		$this->db->select('*')->from($this->getTable());
		
		if (is_array($data)) {
			$this->db->where($data);
		} else {
			$this->db->where($this->primary_key, $data);
		}
		
		$q = $this->db->build_query();
		
		if (Model_Provider::has($q)) {
			$this->db->reset();
			
			$obj = Model_Provider::get($q);
			// echo "<div class='alert alert-success'>$q</div>";
			
			$this->fill($obj->to_array());
			
			return $obj;
		} else {
			$result = $this->db->get_one();

			$this->data = $result;
			
			Model_Provider::set($this->db->last_query, $this);
			
			return $this;
		}
	}

	/**
	*
	*	Fill the data array of this model. Useful for adding data from $_POST quickly
	*
	*	@param  array $data An associative array containing one or more fields => value pairs
	*
	*	@return $this
	*
	*/
	public function fill($data) {

		$not_added = array();
		
		if($this->check_fields) {
			foreach($data as $key => $value) {
				if(in_array($key, $this->fields)) {
					$this->data[$key] = $value;
				}else{
					$not_added[$key] = $value;
				}
			}
		}else{
			$this->data = $data;
		}

		return $this;
	}

	/**
	*
	*	Insert or update this record in the table
	*
	*	@return boolean Whether the insert/update was successful or not
	*
	*/
	public function save() {
		
		if(!isset($this->data[$this->primary_key])) {
			$success = $this->db
				->set($this->data)
				->insert($this->getTable());

			$this->data[$this->primary_key] = $this->db->last_insert_id;
		}else{
			$success = $this->db
				->set($this->data)
				->where($this->primary_key, $this->data[$this->primary_key])
				->update($this->getTable());
		}

		return $success;
	}

	/**
	*
	*	Delete this record from the table. This is a soft delete
	*
	*	@return boolean Whether the delete was successful
	*
	*/
	public function delete() {
		return $this->soft_delete();
	}

	/**
	*
	*	Specifically perform a soft delete.
	*
	*	This only sets the 'deleted' field of this record to 1
	*
	*	@return boolean Whether the delete was successful
	*
	*/

	public function soft_delete() {
		if($this->data[$this->primary_key]) {
			$this->data['deleted'] = 1;
			return $this->save();
		}else{
			return false;
		}
	}

	/**
	*
	*	Specifically perform a hard delete.
	*
	*	This is different to a soft delete because the record will
	*	be permanently removed from the db.
	*
	*	@return boolean Whether the delete was successful
	*
	*/

	public function hard_delete() {
		if($this->data[$this->primary_key]) {
			return $this->db
				->where($this->primary_key, $this->data[$this->primary_key])
				->delete($this->getTable());
		}else{
			return false;
		}
	}


	public function force($var, $val) {
		$this->data[$var] = $val;
	}
	
	
	public function getTable() {
		if($this->table) {
			return $this->table;
		} else {
			$table = get_class($this);
			$segments = explode('\\', $table);
			return strtolower($segments[count($segments)-1]).'s';
		}
	}
	
	
	public function hasOne($model, $foreign_key = null, $local_key = null) {

		if(strpos($model, '\\') === false) {
			$model = 'App\\Model\\'.$model;
		}

		$m = new $model();
		
		# assume the local_key
		if(is_null($foreign_key)) {
			$foreign_key = $this->getTable().'_id';
		}
		
		if(is_null($local_key)) {
			$local_key = $m->primary_key;
		}

		$c = new Database(Config::$database);

		$c
			->select('*')
			->from($m->getTable())
			->model($model)
			->set_get_method('get_one')
			->where($foreign_key, $this->$local_key);
		
		return $m;
	}
	

	public function belongsTo($model, $local_key = null, $parent_key = null) {
		if(strpos($model, '\\') === false) {
			$model = 'App\\Model\\'.$model;
		}

		$m = new $model();
		
		$class_name = explode('\\', $model);
		$class_name = $class_name[count($class_name) - 1];
		
		if(is_null($local_key)) {
			$local_key = $this->primary_key;
		}
		
		if(is_null($parent_key)) {
			$parent_key = strtolower($class_name) . '_id';
		}

		$c = new Database(Config::$database);

		$c
			->select('*')
			->from($m->getTable())
			->model($model)
			->set_get_method('get_one')
			->where($local_key, $this->$parent_key);
		
		return $c;
	}
	
	
	public function hasMany($model, $foreign_key = null, $where = []) {

		if(strpos($model, '\\') === false) {
			$model = 'App\\Model\\'.$model;
		}
		
		$class_name = explode('\\', get_class($this));
		$class_name = $class_name[count($class_name) - 1];
		
		if(is_null($foreign_key)) {
			$foreign_key = strtolower($class_name).'_id';
		}
		
		$id = $this->primary_key;

		$c = new Database(Config::$database);

		$m = new $model();
		
		$c->select('*')
			->from($m->getTable())
			->where($foreign_key, $this->$id)
			->where($where)
			->model($model);
		
		return $c;
	}
	
	public function belongsToMany($model, $join_table, $this_id = null, $that_id = null, $where = []) {

		# fix model name if missing "App\Model\""
		if(strpos($model, '\\') === false) {
			$model = 'App\\Model\\'.$model;
		}
		
		$m = new $model();

		$this_name = explode('\\', get_class($this));
		$this_name = $this_name[count($this_name) - 1];

		$that_name = explode('\\', get_class($m));
		$that_name = $that_name[count($that_name) - 1];
		
		if(is_null($this_id)) {
			$this_id = strtolower($this_name).'_id';
		}
		
		if(is_null($that_id)) {
			$that_id = strtolower($that_name).'_id';
		}
		
		$id = $this->primary_key;
		
		$fields = [];
		
		foreach($m->fields as $field) {
			$fields[] = $m->getTable().'.'.$field;
		}

		$c = new Database(Config::$database);

		$results = $c
			->select('*')
			->from($join_table)
			->where($this_id, $this->$id)
			->get();
		
		$c
			->select(implode(', ', $fields))
			->from(implode(', ', [$join_table, $m->getTable(), $this->getTable()]))
			->where($m->getTable().'.'.$m->primary_key, $join_table.'.'.$that_id, false)
			->where($this->getTable().'.'.$this->primary_key, $join_table.'.'.$this_id, false)
			->where($this->getTable().'.'.$this->primary_key, $this->$id)
			->where($where)
			->model($model)
			/* holy fucking fuck this each function */
			->each(function($model, $results, $that_id) {
				foreach($results as $result) {
					if($result[$that_id] == $model->id) {
						foreach($result as $key => $val) {
							if(!$model->$key && $key !== $that_id && $key !== $this_id) {
								$model->force($key, $val);
							}
						}
					}
				}
			}, [$results, $that_id]);

		return $c;
	}

	private static function newdb() {
		$db = new Database(Config::$database);

		$self = new static;

		return $db->select('*')->from($self->getTable())->model(get_class($self));
	}

	public static function find($id) {
		if(is_array($id)) {
			$where = $id;
		} else {
			$where = ['id' => $id];
		}
		
		return self::newdb()->where($where)->get_one();
	}

	public static function all() {
		return self::newdb()->get();
	}

	public static function where($param1, $param2 = null, $param3 = null, $param4 = null) {
		return self::newdb()->where($param1, $param2, $param3, $param4);
	}

	public static function where_and($param1, $param2 = null, $param3 = null) {
		return self::newdb()->where($param1, $param2, $param3);
	}
	
	public static function where_or($param1, $param2 = null, $param3 = null) {
		return self::newdb()->where_or($param1, $param2, $param3);
	}
	
	public static function order_by($data, $dir = null) {
		return self::newdb()->order_by($data, $dir);
	}
	
	public static function limit($from, $count) {
		return self::newdb()->limit($from, $count);
	}
	
	public static function paginate($count, $page = 1) {
		return self::newdb()->limit(($page - 1) * $count, $count);
	}


	public function to_array() {
		$data = $this->data;
		
		if(!$data) {
			$data = [];
		}
		
		foreach($data as $key => $val) {
			$data[$key] = XSS::filter($val);
		}
		
		return $this->data;
	}
	
	public function __TOSTRING() {
		return json_encode($this->to_array());
	}
	
	public function to_json() {
		return $this->__TOSTRING();
	}


}


class Field_Provider {
	
	private static $tables = [];
	
	public static function table($name, $db) {
		if(self::$tables[$name] === null) {
			self::$tables[$name] = $db->get_columns($name);
		}
		
		return self::$tables[$name];
	}
}

class Model_Provider {
	
	private static $queries = [];
	
	public static function set($query, $data) {
		self::$queries[$query] = $data;
	}
	
	public static function has($query) {
		return isset(self::$queries[$query]);
	}
	
	public static function get($query) {
		return self::$queries[$query];
	}
	
}