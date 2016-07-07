<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>404</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:400,300,700">
	<style>
		body {
			font-family: 'Open Sans', Helvetica, sans-serif;
			background: #eee;
			margin: 2.5em 3.75em;
		}

		h1 {
			font-weight: 300;
			font-size: 3em;
		}

		p {
			font-size: 1.2em;
		}

		code {
			background: #fff;
			padding: 0.2em 0.4em;
			border-radius: 3px;
			color: red;
			font-weight: 700;
		}
	</style>
</head>
<body>
	<div>
		<h1>Page Not Found</h1>
		<p>There's nothing at <code><?= $_SERVER['REQUEST_METHOD'] ?> <?= App\URL::current() ?></code></p>
	</div>
</body>
</html>