<?php

    // post.php: post messages to a FIFO
    //
    // Copyright Ericsson AB, 2011. The software may only be used as
    // specified by the copyright holder.
    //
    // THE SOFTWARE IS PROVIDED “AS IS”. ERICSSON MAKES NO REPRESENTATIONS
    // OR WARRANTIES WITH RESPECT TO THE SOFTWARE,WHETHER EXPRESS OR IMPLIED,
    // INCLUDING BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND
    // FITNESS FOR A PARTICULAR PURPOSE. SPECIFICALLY, WITHOUT LIMITING THE
    // GENERALITY OF THE FOREGOING, ERICSSON MAKES NO REPRESENTATION OR WARRANTY
    // THAT (I) THE USE OF THE SOFTWARE AND OR PARTS THEREOF WILL BE
    // UNINTERRUPTED OR ERRORFREE, AND OR (II) ANY REPRODUCTION, USE OF THE
    // SOFTWARE AND OR PARTS THEREOF ARE FREE FROM INFRINGEMENT OF ANY
    // INTELLECTUAL PROPERTY RIGHTS AND IT SHALL BE THE SOLE RESPONSIBILITY
    // OF THE USER TO MAKE SUCH DETERMINATION AS IS NECESSARY WITH RESPECT TO
    // THE ACQUISITION OF LICENSES. CONSEQUENTLY, IN NO EVENT SHALL ERICSSON
    // BE LIABLE TO ANY PARTY FOR ANY LOSS OR DAMAGES (WHETHER DIRECT, INDIRECT
    // OR CONSEQUENTIAL) ARISING FROM ANY USE, REPRODUCTION AND OR DISTRIBUTION
    // OF THE SOFTWARE AND OR ANY PARTS THEREOF.

    $fifoid    = $_POST["id"];
    $msgArray  = array ( "msgBody" => $_POST["msg"] );

    if (strpos($fifoid, "/")) die("invalid FIFO");

    $fd = fopen("/var/run/starchat/$fifoid", "w");
    if (! $fd) die("cannot open FIFO");

    fputs($fd, "data: " . json_encode($msgArray) . "\n");
    fclose($fd);
?>