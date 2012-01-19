$(function(){
    var gimmebarDomainRegexp = new RegExp("^(www\.)?gimmebar\.com$"),
        gimmebarBase = "https://gimmebar.com/",
        gimmebarApiBase = gimmebarBase + "api/v0/public/assets/",
        gimmebarViewBase = gimmebarBase + "view/",
        per_page = 20,
        username,
        collection,
        page;

    // functions
    
    function reset()
    {
        clearMessage();
        $("#results").hide();
    }
    
    function clearMessage()
    {
        $("#messagebox").hide().text("").removeClass().addClass('alert-message');
    }
    
    function showError(message)
    {
        $("#messagebox").text(message).addClass('error').show();
    }
    
    function getUsernameAndCollection(url)
    {
        var link = $("<a>", {href: url}).get(0),
            username = false,
            collection = false;
        if(!link.hostname || !link.hostname.match(gimmebarDomainRegexp))
        {
            return "Sorry... this isn't a valid Gimme Bar URL.";
        }
        var path = link.pathname.split("/");
        if (path[1] == "collection")
        {
            return "Sorry... this page can't handle collaborative collections... yet.";
        }
        else if (path[1] == "loves")
        {
            username = path[2];
            if (path[4] != undefined) collection = path[4];
        }
        else if (path[1] == "api")
        {
            if (path[3] != "public")
            {
                return "Sorry... this doesn't look like a public API URL."
            }
            if (path[4] != "assets")
            {
                return "Sorry... this doesn't look like a collection API URL."
            }
            username = path[5];
            if (path[6] != undefined)
            {
                var part6 = path[6];
                var part6parts = part6.split(".");
                collection = part6parts[0];
            }
        }
        else
        {
            return "Sorry... this page can't handle this URL."
        }
        return [username, collection];
    }
    
    function loadData(username, collection, page)
    {
        var url = gimmebarApiBase + username;
        if (collection) url += "/" + collection;
        url += ".js";
        $.ajax(url, {
            cache: true,
            dataType: "jsonp",
            jsonp: "jsonp_callback",
            data: { limit: per_page, skip: (page - 1) * per_page },
            success: function(data) {
                if (data.records) showData(data);
            }
        });
    }
    
    function showData(data)
    {
        var start = data.skip + 1,
            end = start + data.records.length - 1;
        var lbl = "Showing items <strong>" + start + "</strong> to <strong>" +
                  end + "</strong> of <strong>" + data.total_records + "</strong>";
        $("#results-page").html(lbl);
        
        var prev = $(".pagination .prev");
        if (data.skip == 0) prev.addClass("disabled"); else prev.removeClass("disabled");
        var next = $(".pagination .next");
        if (data.more_records) next.removeClass("disabled"); else next.addClass("disabled");
        
        var tableBody = $("#results-table tbody").html("");
        for (var i in data.records)
        {
            tableBody.append(createRow(data.records[i]));
        }
        
        $("#results").show();
    }
    
    function createRow(record)
    {
        var sourceLink = record.source;
        if (sourceLink.length > 100) sourceLink = sourceLink.substr(0,97) + "...";
        var tr = $("<tr>");
        tr.append($("<td>").text(record.title));
        tr.append($("<td>").text(record.description));
        tr.append($("<td>").append($("<a>", {href:record.source}).text(sourceLink)));
        tr.append($("<td>").append($("<a>", {href:gimmebarViewBase+record.id}).text("View")));
        return tr;
    }
    
    // events
    
    $("#collection").submit(function(e){
        e.preventDefault();
        reset();
        var url = $("#collection-url").val();
        if (url)
        {
            var usercoll = getUsernameAndCollection(url);
            if (typeof(usercoll) == "string")
            {
                showError(usercoll);
            }
            else
            {
                username = usercoll[0];
                collection = usercoll[1];
                per_page = $("#collection-page").val();
                page = 1;
                loadData(username, collection, page);
            }
        }
    });
    
    $(".pagination .prev").click(function(e){
        e.preventDefault();
        if (!$(this).hasClass("disabled"))
        {
            page--;
            loadData(username, collection, page);
        }
    });
    
    $(".pagination .next").click(function(e){
        e.preventDefault();
        if (!$(this).hasClass("disabled"))
        {
            page++;
            loadData(username, collection, page);
        }
    });
    
    // onload
    $("#collection-page").val(per_page);
});