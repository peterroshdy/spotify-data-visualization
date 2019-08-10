if(window.location.pathname == '/home' || window.location.pathname == '/home/'){
    $( ".navv_home" ).addClass( "active" );
    $( ".navv_tracks" ).removeClass( "active" );
    $( ".navv_artists" ).removeClass( "active" );
}else if(window.location.pathname == '/topTracks' || window.location.pathname == '/topTracks/'){
    $( ".navv_tracks" ).addClass( "active" );
    $( ".navv_home" ).removeClass( "active" );
    $( ".navv_artists" ).removeClass( "active" );
}else if(window.location.pathname == '/topArtists' || window.location.pathname == '/topArtists/'){
    $( ".navv_artists" ).addClass( "active" );
    $( ".navv_home" ).removeClass( "active" );
    $( ".navv_tracks" ).removeClass( "active" );
}else{
    console.log('unknown');
}
