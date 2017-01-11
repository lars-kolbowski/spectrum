<?php
$json = file_get_contents('http://xi3.bio.ed.ac.uk/xiAnnotator/annotate/knownModifications');
echo json_encode($json);
?>