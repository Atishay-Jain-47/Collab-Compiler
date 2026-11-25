$ErrorActionPreference='Stop'
$dll=Get-ChildItem 'C:/windows/assembly/GAC_MSIL/Microsoft.Office.Interop.PowerPoint' -Recurse -Filter '*.dll' | Select-Object -First 1
[Reflection.Assembly]::LoadFrom($dll.FullName) | Out-Null
$eff=[Microsoft.Office.Interop.PowerPoint.MsoAnimEffect]
$trans=[Microsoft.Office.Interop.PowerPoint.PpEntryEffect]
$pp=New-Object -ComObject PowerPoint.Application
$deck=$pp.Presentations.Open((Resolve-Path base.pptx).Path,0,0,0)
try{
$rows=Get-Content -Raw -Encoding UTF8 content.json | ConvertFrom-Json
$plan=@('# Collab Compiler animation plan','','Use Slide Show in desktop PowerPoint. Each numbered cue takes one click. Within a cue, the arrow wipes on and the related elements enter together with a short stagger. Titles and layout guides on content slides are visible on entry.','')
foreach($slide in $deck.Slides){
$n=$slide.SlideIndex
$type=$rows[$n-1][0]
$slide.SlideShowTransition.EntryEffect=$trans::ppEffectFadeSmoothly
$slide.SlideShowTransition.Duration=0.5
$steps=@{}
foreach($sh in $slide.Shapes){
if($sh.Name -match '^b([1-9]+)_'){
$key=[int]$Matches[1]
if(!$steps.ContainsKey($key)){$steps[$key]=New-Object System.Collections.ArrayList}
[void]$steps[$key].Add($sh)
}}
$sequence=$slide.TimeLine.MainSequence
$plan+=('## '+$n+'. '+$rows[$n-1][1])
$plan+=''
$transition=if($n -in 3,15){'Zoom In'}elseif($n -in 7,9){'Morph by object, with Fade fallback'}else{'Smooth Fade'}
$plan+=('Transition — '+$transition+' (0.5 s).')
$plan+=''
foreach($k in ($steps.Keys | Sort-Object)){
$first=$true
$labels=@()
$types=@()
foreach($sh in $steps[$k]){
$effect=$eff::msoAnimEffectFade
if($sh.Name -match '_arrow_'){$effect=$eff::msoAnimEffectWipe}
elseif($sh.Name -match '_image_'){$effect=$eff::msoAnimEffectFadedZoom}
elseif($type -in 'cards','map' -and $sh.Name -match '_text_'){$effect=$eff::msoAnimEffectFloat}
if($sh.HasTextFrame -and $sh.TextFrame.HasText){$labels+=$sh.TextFrame.TextRange.Text}
$trigger=if($first){1}else{2}
$anim=$sequence.AddEffect($sh,$effect,0,$trigger)
$anim.Timing.Duration=0.38
if(!$first){$anim.Timing.TriggerDelayTime=0.055}
if($effect -eq $eff::msoAnimEffectWipe){$anim.EffectParameters.Direction=if($n -eq 7 -and $k -eq 5 -or $n -eq 12 -and $k -eq 3){[Microsoft.Office.Interop.PowerPoint.MsoAnimDirection]::msoAnimDirectionLeft}else{[Microsoft.Office.Interop.PowerPoint.MsoAnimDirection]::msoAnimDirectionRight}}
$types+=$effect.ToString().Replace('msoAnimEffect','')
$first=$false
}
$caption=($labels | Where-Object {$_ -notmatch '^0\d$'} | Select-Object -First 2) -join ' — '
if(!$caption){$caption='Reveal the captured product screen.'}
if($n -eq 7 -and $k -in 4,5){
$sh=$steps[$k] | Where-Object {$_.Name -match '_arrow_'} | Select-Object -First 1
$dot=$slide.Shapes.AddShape(9,$sh.Left,$sh.Top+2,7,7)
$dot.Name='Request or response marker '+$k
if($k -eq 5){$dot.Left=$sh.Left+$sh.Width-7}
$dot.Fill.ForeColor.RGB=16777215
$dot.Line.Visible=0
$add=$sequence.AddEffect($dot,$eff::msoAnimEffectFade,0,2)
$add.Timing.Duration=0.15
$motion=$sequence.AddEffect($dot,$eff::msoAnimEffectPathRight,0,2)
$motion.Behaviors.Item(1).MotionEffect.Path= if($k -eq 4){'M 0 0 L 0.073 0 E'}else{'M 0 0 L -0.073 0 E'}
$motion.Timing.Duration=0.48
$types+='Motion path (0.48 s)'
}
if($n -eq 14 -and $k -eq 5){
$target=$steps[$k] | Where-Object {$_.HasTextFrame -and $_.TextFrame.TextRange.Text -eq 'Peers display'} | Select-Object -First 1
if($target){$pulse=$sequence.AddEffect($target,$eff::msoAnimEffectGrowShrink,0,3);$pulse.Behaviors.Item(1).ScaleEffect.ByX=105;$pulse.Behaviors.Item(1).ScaleEffect.ByY=105;$pulse.Timing.Duration=0.18;$pulse.Timing.AutoReverse=-1;$types+='Grow/Shrink emphasis'}
}
$plan+=('1. '+$caption+' ('+(($types | Select-Object -Unique) -join ', ')+').')
}
$plan+=''
}
$plan+='The listed sequences are embedded in the file. No manual animation setup is required. Each entrance lasts 0.38 s unless otherwise noted. Later elements within a cue use a 0.055 s delay. PowerPoint versions without Morph use the fallback transition.'
$plan | Set-Content -Encoding UTF8 '../Presentation/Animation_Plan.md'
$deck.SaveAs((Join-Path $PWD 'animated.pptx'))
$deck.Export((Join-Path $PWD 'renders'),'PNG',1280,720)
}finally{$deck.Close();if($pp.Presentations.Count -eq 0){$pp.Quit()}}

