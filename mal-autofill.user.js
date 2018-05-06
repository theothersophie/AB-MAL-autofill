// ==UserScript==
// @name        Sophie's Amazing MAL Autofill
// @author      theothersophie
// @namespace   https://github.com/theothersophie/AB-MAL-autofill/raw/master/mal-autofill.user.js
// @downloadURL https://github.com/theothersophie/AB-MAL-autofill/raw/master/mal-autofill.user.js
// @include     *animebytes.tv/upload.php*
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @grant       GM.xmlHttpRequest
// @version     2018.05.06
// ==/UserScript==
//jshint esversion: 6

//Avoid conflicts
this.$ = this.jQuery = jQuery.noConflict(true);

var malAutofillHtml = `
<dt>MyAnimeList Autofill</dt>
<dd>
    <input id="mal_autofill" size="50" value="" type="text">
    <input id="mal_autofill_button" value="Autofill!" type="button"><br> The link should look like: https://myanimelist.net/manga/1/Monster<br>
    <div id="auto_mal"></div>
</dd>
`;

$(document).ready(function() {

  $("#light_novels_form #group_information .box, #manga_form #group_information .box").prepend(malAutofillHtml);
  $('#light_novels_form #mal_autofill_button, #manga_form #mal_autofill_button').click(function() {
    autofill_mal();
  });
});

function get_myanimelist_id() {
  var e = $('.ui-tabs-panel[aria-hidden="false"] #mal_autofill').val();
  console.log(e);
  if (!e) {
    $('#auto_mal').css({
      'color': 'red'
    });
    return $('#auto_mal').text("Hey! You need to give me some information before I can autofill for you!"), 0;
  } else {
    $("#auto_mal").hide();
  }
  var t = /http[s]?:\/\/myanimelist.net\/(manga|anime)\/([0-9]+)/;
  if (!e.match(t)) {
    return alert("Invalid MyAnimeList link."),
      0;
  }
  if (e.search('\/anime\/') != -1) {
    return alert('This link is for an anime. MAL Autofill is only for manga or novel links.'), 0;
  }
  var a = e.match(t)[2];
  return a;
}

function autofill_mal() {
  id = get_myanimelist_id();

  if (!id) {
    return;
  }
  jikan = "https://api.jikan.moe/";
  type = "manga";
  entry = "";

  request_url = jikan + type + "/" + id;
  console.log(request_url);

  GM.xmlHttpRequest({
    method: "GET",
    url: request_url,
    onload: function(response) {

      console.log([
        response.status,
        response.statusText,
        response.readyState,
        response.responseHeaders,
        response.responseText,
        response.finalUrl,
      ].join("\n"));

      if (response.status == 200) {
        jsonResponse = JSON.parse(response.responseText);

        type = "";
        //get id attribute of visible element with class name that begins with ui-tabs-panel
        tab = $('div[class^="ui-tabs-panel"]:visible').attr('id');
        if (jsonResponse.type == "Manga") {
          type = "_manga";
          if (tab != "manga") {
            return alert("MAL says this is a manga. You have selected the incorrect upload form."), 0;
          }
        } else if (jsonResponse.type == "Novel") {
          type = "_light_novels";
          if (tab != "light_novels") {
            return alert("MAL says this is a novel. You have selected the incorrect upload form."), 0;
          }
        } else {
          return alert("Error: This entry is not a manga or novel"), 0;
        }

        fill_inputs(jsonResponse, type);
      }
    }
  });


  function fill_inputs(entry, type) {

    $("#series_name" + type).val(entry.title);
    $("#series2" + type).val(entry.title_japanese);
    tags = get_tags(entry);
    $("#tags" + type).val(tags);
    $("#year" + type).val(entry.published.from.slice(0, 4));
    $("#image" + type).val(entry.image_url);
    if (entry.synopsis.substr(0, 23) == "Looking for information") {
      $("#desc" + type).val('No description.');
    } else {
      synopsis = decodeHtml(entry.synopsis);
      $("#desc" + type).val(synopsis);
    }

    //toggle the Ongoing checkbox
    if ((entry.publishing == "true") || (entry.status == "Publishing")) {
      $('input[name=ongoing]').trigger('click');
    }

    //Specific Type
    filename = get_filename();

    if ((type == '_light_novels') && (filename)) {
      fill_specific_type();
    }

    function fill_specific_type() {
      console.log(filename);
      filename = get_filename();

      if (filename.indexOf('epub') !== -1) {
        $("#specifictype").val("EPUB");
      } else if (filename.indexOf('pdf') !== -1) {
        $("#specifictype").val("PDF");
      } else {
        $("#specifictype").val("Archived Scans");
      }
    }


    function decodeHtml(html) {
      var txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    }

    function get_tags(entry) {
      aTags = [];
      for (i = 0; i < entry.genre.length; i++) {
        genre = entry.genre[i].name;

        if (genre.search(" ")) {
          genre = genre.replace(" ", ".");
        }

        //toggle the hentai checkbox
        if (genre == "Hentai") {
          $('input[name=hentai]').trigger('click');
        }

        aTags.push(genre);

      }
      strTags = aTags.toString(',');
      console.log(strTags);
      return strTags;
    }

    function get_filename() {
      var fullPath = document.getElementById('file_input' + type).value;
      if (fullPath) {
        var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        var filename = fullPath.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
          filename = filename.substring(1);
        }
        return filename;

      }
    }

  }
}