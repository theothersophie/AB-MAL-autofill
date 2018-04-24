// ==UserScript==
// @name        Sophie's Amazing MAL Autofill
// @author      theothersophie
// @namespace   https://github.com/theothersophie/AB-MAL-autofill/blob/master/mal-autofill.js
// @include     *animebytes.tv/upload.php*
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @grant       GM.xmlHttpRequest
// @version     2018.04.20
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

function get_myanimelist_id() {
  var e = $("#mal_autofill").val();
  if (!e) {
    return $('input[id="auto_mal"]:visible').text("Hey! You need to give me some information before I can autofill for you!"),
      0;
  }
  var t = /http[s]?:\/\/myanimelist.net\/(manga|anime)\/([0-9]+)/;
  if (!e.match(t)) {
    return alert("Invalid MyAnimeList link."),
      0;
  }
  var a = e.match(t)[2];
  return a;
}

function autofill_mal() {
  console.log("autofill called");
  id = get_myanimelist_id();
  jikan = "https://api.jikan.moe/";
  type = "manga";
  entry = "";

  console.log(id);
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
        fill_inputs(jsonResponse);
      }
    }
  });


  function fill_inputs(entry) {
    $("#series_name_light_novels").val(entry.title);
    $("#series2_light_novels").val(entry.title_japanese);
    tags = get_tags(entry);
    $("#tags_light_novels").val(tags);
    $("#year_light_novels").val(entry.published.from.slice(0, 4));
    $("#image_light_novels").val(entry.image_url);
    if (entry.synopsis.substr(0, 23) == "Looking for information") {
      $("#desc_light_novels").val('No description.');
    } else {
      synopsis = decodeHtml(entry.synopsis);
      $("#desc_light_novels").val(synopsis);
    }

    //toggle the Ongoing checkbox
    if (entry.status == "Publishing") {
      $('input[name=ongoing]').trigger('click');
    } else if (entry.status == "Unknown") {
      alert("Entry status is Unknown");
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

  }
}

$(document).ready(function() {

  $("#light_novels_form #group_information .box").prepend(malAutofillHtml);
  $("#mal_autofill_button").on("click", autofill_mal);

});