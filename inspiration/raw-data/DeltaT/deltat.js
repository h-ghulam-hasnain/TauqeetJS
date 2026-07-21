function movepic(img_name,img_src) {
document[img_name].src=img_src;
}

function round(x){

  xsign=' ';
  if(x<0) xsign='-';
  xabs=Math.abs(x);
  xint=Math.floor(xabs+0.005);
  xfrac=Math.round(100*(xabs-xint));
  if(xfrac<10) xfrac='0'+xfrac;

  return xsign+xint+'.'+xfrac;
}

function deltatime(){

  year=parseFloat(document.deltat.a.value);
  lunpar=parseFloat(document.deltat.b.value);

  yat=(year-1955.5)/100;
  yat2=0;
  if(year<1955.5) yat2=0.91072*yat*yat;

  u=(year-1900)/100;
  iau1952=(24.349+u*(72.318+29.950*u))/60;
  iau1952=iau1952-yat2*(lunpar+22.44)/60;

document.deltat.dt1.value=round(iau1952);

  u=(year-1900)/100;
  ae1960=(24.349+u*(72.3165+29.949*u))/60;
  ae1960=ae1960-yat2*(lunpar+22.44)/60;

document.deltat.dt2.value=round(ae1960);

  u=(year-1900)/100;
  t1962=(4.87+u*(35.06+36.79*u))/60;

document.deltat.dt3.value=round(t1962);

  u=(year-1900)/100;
  ms1975=(66+u*(120.38+45.78*u))/60;
  ms1975=ms1975-yat2*(lunpar+37.5)/60;

document.deltat.dt4.value=round(ms1975);

  u=(year-1900)/100;
  s1978=(20+u*(114+38.3*u))/60;
  s1978=s1978-yat2*(lunpar+30.0)/60;

document.deltat.dt5.value=round(s1978);

  u=(year-1810)/100;
  ms1982=(-15+32.5*u*u)/60;
  ms1982=ms1982-yat2*(lunpar+26.0)/60;

document.deltat.dt6.value=round(ms1982);

  u=(year-1800)/100;
  if(year<=948) sm1984=(1360+u*(320+44.3*u))/60;
  if(year>948) sm1984=(25.5*u*u)/60;
  sm1984=sm1984-yat2*(lunpar+26.0)/60;

document.deltat.dt7.value=round(sm1984);

  u1=(year-948)/100;
  u2=(year-1850)/100;
  if(year<=948) sh1986=(1830+u1*(46.5*u1-405))/60;
  if(year>948) sh1986=(22.5*u2*u2)/60;
  sh1986=sh1986-yat2*(lunpar+26.0)/60;

document.deltat.dt8.value=round(sh1986);

  u=(year-2000)/100;
  e1987=(67+u*(61+64.3*u))/60;

document.deltat.dt9.value=round(e1987);
  if((year<1950) || (year>2100)) document.deltat.dt9.value='  ----  ';

  u=(year-1625)/100;
  b1988=(40+35.0*u*u)/60;
  b1988=b1988-yat2*(lunpar+23.8946)/60;

document.deltat.dt10.value=round(b1988);

  u=(year-2000)/100;
  if(year<=948) ctc1991=(2177+u*(495+42.4*u))/60;
  if(year>948) ctc1991=(102+u*(100+23.6*u))/60;
  ctc1991=ctc1991-yat2*(lunpar+23.8946)/60;

document.deltat.dt11.value=round(ctc1991);

  u=(year-2000)/100;
  if(year<=948) cctg1997=(2177+u*(497+44.1*u))/60;
  if(year>948) cctg1997=(102+u*(102+25.3*u))/60;
  cctg1997=cctg1997-yat2*(lunpar+25.7376)/60;

document.deltat.dt12.value=round(cctg1997);

  if((year<=1620) || (year>2019)){
    u=(year-1810)/100;
    rd2001=(-15+32.5*u*u)/60;
  }
  
  if((year>1620) && (year<=1800)){
    u=(year-1620)/100;
    rd2001=(196.58333+u*(-406.75+219.167*u))/60;
  }
  
  if((year>1800) && (year<=1900)) rd2001=0;
  
  if((year>1900) && (year<=1988)){
    u=(year-1900)/100;
    rd2001=1440*(-0.00002+u*(0.000297+u*(0.025184+u*(-0.181133+u*(0.553040+u*(-0.861938+u*(0.677066-u*0.212591)))))));
  }
  
  if((year>1988) && (year<=2019)){
    u=(year-1900)/100;
    rd2001=(-33+100*u)/60;
  }
    
document.deltat.dt13.value=round(rd2001);

  if(year<=948){
    u=(year-1820)/100;
    jplhorizons=(31*u*u)/60;
  }
  
  if(year>948){
    u=(year-2000)/100;
    jplhorizons=(50.6+u*(67.5+22.5*u))/60;
  }
    
  jplhorizons=jplhorizons-yat2*(lunpar+25.7376)/60;

document.deltat.dt14.value=round(jplhorizons,2);

  if((year<=-500) || (year>2150)){
    u=(year-1820)/100;
    em2006=-20+32*u*u;
  }

  if((year>-500) && (year<=500)){
    u=year/100;
	em2006=10583.6+u*(-1014.41+u*(33.78311+u*(-5.952053+u*(-0.1798452+u*(0.022174192+0.0090316521*u)))));
  }

  if((year>500) && (year<=1600)){
    u=(year-1000)/100;
    em2006=1574.2+u*(-556.01+u*(71.23472+u*(0.319781+u*(-0.8503463+u*(-0.005050998+0.0083572073*u)))));
  }
  
  if((year>1600) && (year<=1700)){
    u=(year-1600)/100;
    em2006=120+u*(-98.08+u*(-153.2+u/0.007129));
  }
  
  if((year>1700) && (year<=1800)){
    u=(year-1700)/100;
    em2006=8.83+u*(16.03+u*(-59.285+u*(133.36-u/0.01174)));
  }
  
  if((year>1800) && (year<=1860)){
	u=(year-1800)/100;
	em2006=13.72+u*(-33.2447+u*(68.612+u*(4111.6+u*(-37436+u*(121272+u*(-169900+87500*u))))));
  }

  if((year>1860) && (year<=1900)){
    u=(year-1860)/100;
    em2006=7.62+u*(57.37+u*(-2517.54+u*(16806.68+u*(-44736.24+u/0.0000233174))));
  }
  
  if((year>1900) && (year<=1920)){
    u=(year-1900)/100;
    em2006=-2.79+u*(149.4119+u*(-598.939+u*(6196.6-19700*u)));
  }
  
  if((year>1920) && (year<=1941)){
	u=(year-1920)/100;
	em2006=21.20+u*(84.493+u*(-761.00+2093.6*u));
  }
  
  if((year>1941) && (year<=1961)){
    u=(year-1950)/100;
    em2006=29.07+u*(40.7+u*((-1./0.0233)+u/0.002547));
  }
  
  if((year>1961) && (year<=1986)){
    u=(year-1975)/100;
    em2006=45.45+u*(106.7+u*((-1./0.026)-u/0.000718));
  }
  
  if((year>1986) && (year<=2005)){
    u=(year-2000)/100;
    em2006=63.86+u*(33.45+u*(-603.74+u*(1727.5+u*(65181.4+237359.9*u))));
  }

  if((year>2005) && (year<=2050)){
    u=(year-2000)/100;
    em2006=62.92+u*(32.217+55.89*u);
  }
  
  if((year>2050) && (year<=2150)){
    u=(year-1820)/100;
    em2006=-205.72+u*(56.28+32*u);
  }

  em2006=(em2006-yat2*(lunpar+26))/60;

document.deltat.dt15.value=round(em2006);

}
