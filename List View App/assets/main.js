/* Define global variables */

var default_folder = 'Unfiled';
var folder_split_token = '::';

var client = ZAFClient.init();
client.set('iconSymbol', 'default');

var final_view_ids = new Set();
var final_tree = new Map();
var final_tree_html = '';

$(document).ready(function() {
    client.metadata().then(function (metadata) {
        settingsParam = metadata.settings;
        console.log(settingsParam);
        
    });
	
	
    $('#refresh_button').click(function() {
    	location.reload();
	});
	
	
    client.request("/api/v2/views/active.json?per_page=1000").then(
      function(data) { 
        init(data); 
      },
      function(response) {
        console.error(response.responseText);
      }
    );


});


function init(data){
	fetched_views = data;
	for(var i = 0, len = fetched_views.views.length; i < len; i++)
	{
		var hir = fetched_views.views[i].title.split(folder_split_token);
		build_tree(hir,final_tree,fetched_views.views[i])
	}

	build_view(final_tree,null,null);
	$('#tree').html(final_tree_html);
	

	var toggler = document.getElementsByClassName("caret");
	
	for (var i = 0; i < toggler.length; i++) {
	  	toggler[i].addEventListener("click", function() {
		this.parentElement.querySelector(".nested").classList.toggle("active");
		this.classList.toggle("caret-down");
	  });
	}

	client.request("/api/v2/views/count_many.json?per_page=1000&ids="+Array.from(final_view_ids).join(',')).then(
	  function(data) { 
		for(var i = 0, len = data.view_counts.length; i < len; i++)
		{
			var a = '#'+ data.view_counts[i].view_id;
			$(a).html(data.view_counts[i].value);
		}
	  },
	  function(response) {
		console.error(response.responseText);
	  }
	);  

}



function base64url(source) {
    // Encode in classical base64
    encodedSource = CryptoJS.enc.Base64.stringify(source);
    
    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+$/, '');
    
    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    
    return encodedSource;
}

function build_tree(cur_pos,cur_tree,cur_view)
{
    var pos = cur_pos.shift();
    if(pos ==  cur_view.title)
        pos = default_folder;
    if(!cur_tree.has(pos)) {cur_tree.set(pos,new Map());}

    if(cur_pos.length>1 )
    {
    	build_tree(cur_pos,cur_tree.get(pos),cur_view);
    }
    else
    {
    	cur_tree.get(pos).set(cur_view.id,cur_view);
    	final_view_ids.add(cur_view.id);
    }
}

function build_view(cur_view, cur_key, map)
{
	if(cur_view.size > 0) 
	{
		if(cur_key != null) 
		{
			final_tree_html += '<li class=""><span class="caret">'+cur_key +'</span><ul class="nested">';
		}
		cur_view.forEach(build_view);
		if(cur_key != null) 
		{
			final_tree_html += '</ul></li>';
		}
	}
	else
	{
		final_tree_html += '<li class=""><a onClick="client.invoke(\'routeTo\',\'views\','+cur_view.id+');" href="#"><div class="view_name">' + cur_view.title.split(folder_split_token)[cur_view.title.split(folder_split_token).length -1] + '</div><div id="' + cur_view.id + '" class="view_count" ><img  class="view_loading" src="images/preloader.gif" /></div></a></li>';
	}
}



