<?

// NOTE: you can run this web page on the command-line in an alternate mode
// to take a source video file and output some 1/2-height fields yourself!
// Example::
//     php ~/scripts/lacer.php good.mov  0.5  0.7

define('IMAGES', (isset($_GET['alt']) || isset($_GET['deinterlaced']) ? 'rj/2323/*png' :'rj/*png'));
define('CROP', '720x240');


// we are running from command line -- let's make some fields from your video!
exit(field_maker());


// running script from command line -- create the php fields from the cmd-line video
function field_maker()
{
  //chdir(dirname(IMAGES)) or die("cannot chdir to ".dirname(IMAGES));

  if ($_SERVER['argc'] != 4)
    die("Usage: interlacy <video file> <-ss> <-endpos>");

  $vid=$_SERVER['argv'][1];
  $ss =$_SERVER['argv'][2];
  $end=$_SERVER['argv'][3];

  $ss = ($ss ? " -ss $ss " : "");

  echo "Removing: ";
  passthru("rm -fv [01]/*pgmyuv  *pgmyuv  *-F[01].png | tr '\n' ' '"); /**/
  echo "\n\n";

  for ($i=0; $i<2; $i++)
  {
    // first, dump even fields as *-F0.png
    // next,  dump odd  fields as *-F1.png
    passthru("env mplayer -nosound $ss -endpos $end $vid  -nosound  -vf field=$i  -vo pnm:pgmyuv");

    // convert the "pgmyuv" format into web viewable PNG format,
    // cropping out the "uv" (chroma) bottom parts so we just
    // see the Y (luminance) part
    passthru("mkdir -p $i; mv *pgmyuv $i/");
    foreach (glob("$i/*pgmyuv") as $fi)
    {
      $fi2 = basename($fi)."-F$i.png";
      passthru("env convert -quality 100 -crop ".CROP."'+0+0!' $fi $fi2");
    }
  }

  // you can comment out this next line to compare all possible fields to each other...
  return;

  $pngs = glob("*-F[01].png");
  foreach ($pngs as $i)
  {
    $scores=array();
    foreach ($pngs as $j)
    {
      if ($i==$j) continue; // don't compare same field with itself

      // use ImageMagick utility to compare the two fields and output a score
      // (the lower the score, the more similar the fields are)
      $scores[$j]=strtok(trim(`env compare -verbose $i $j -metric MAE $i $j null: 2>&1 |fgrep all|cut -f2 -d:`)," ");
    }
    asort($scores);
    list($best,$score) = each($scores);
    print_r($scores);
    echo "best $i $best ($score)\n";
  }
}
