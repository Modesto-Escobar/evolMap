function tutorialTour(options){
  var dim = { width : document.body.clientWidth , height : document.body.clientHeight };
  var panelOffset = 82; // both paddings + both borders
  var body = d3.select(document.body);
  body.select("body > .tutorial").remove();

  var tutorial = body.append("div")
    .attr("class","tutorial")
    .style("top",(dim.height/4)+"px")
    .style("left",(dim.width/4)+"px")
    .style("width",(dim.width/2-panelOffset)+"px")

  var count = 0;
  var steps = [];

  var tutorialContent = tutorial.append("div").attr("class","tutorial-content")

  var tutorialButtons = tutorial.append("div").attr("class","tutorial-buttons")
  tutorialButtons.append("button")
    .attr("class","primary prev")
    .text("<<")
    .on("click",function(){
      if(count>0){
        count--;
        go2step(count);
      }
    })
  tutorialButtons.append("button")
    .attr("class","primary skip")
    .text("Saltar tutorial")
    .on("click",function(){
      tutorial_menu();
    })
  tutorialButtons.append("button")
    .attr("class","primary next")
    .text(">>")
    .on("click",function(){
      if(count<steps.length){
        count++;
        go2step(count);
      }
    })

  var tutorialArrow = body.append("div")
      .attr("class","tutorial-arrow")
      .style("display","none")

  var tutorial2 = body.append("div")
    .attr("class","tutorial")
    .style("display","none")
    .style("width",(dim.width/3-panelOffset)+"px")

  steps.push(function(){
    tutorialContent.selectAll("*").remove()
    if(options.tutorial.image){
      tutorialContent.append("img")
        .attr("src",options.tutorial.image)
        .style("height","60px")
    }
    tutorialContent.append("h3").text(tutorial_texts["elementsmap"])
    tutorialContent.append("p").html(tutorial_texts["beforestarting"])
  });

  if(options.tutorial.description){
    steps.push(function(){
      tutorialContent.selectAll("*").remove()
      tutorialContent.append("p").html(tutorial_texts["mainpage"])
      tutorialContent.append("p").html(options.tutorial.description)
      tutorialContent.append("p").html(tutorial_texts['eachfigure'])
    });
  }

  steps.push(function(){
    tutorial.style("top",(dim.height/4)+"px")
    tutorial.style("left",(dim.width/4)+"px")
    tutorialContent.selectAll("*").remove()
    tutorialContent.append("p").html(tutorial_texts['hoveringthemouse'])
    tutorialContent.append("p").html(tutorial_texts['whenclicking'])
    tutorialArrow.style("display","none")
  });

  var timeNav = body.select(".leaflet-bar.time-control");
  if(!timeNav.empty() && timeNav.node().offsetWidth){
    steps.push(function(){
      tutorialContent.selectAll("*").remove()
      tutorialContent.append("p").html(tutorial_texts['timecontrol'])
      var timeNavDim = timeNav.node().getBoundingClientRect();
      var tutorialDim = tutorial.node().getBoundingClientRect();
      tutorial.style("top",(timeNavDim.top-tutorialDim.height-50)+"px")
      tutorial.style("left",(timeNavDim.left)+"px")

      tutorialArrow.style("display",null)
        .style("transform","rotate(180deg)")
        .style("left",(timeNavDim.left+(timeNavDim.width/2))+"px")
        .style("top",(timeNavDim.top-60)+"px")
    });
  }

  steps.push(function(){
    tutorialContent.selectAll("*").remove()
    tutorialContent.append("p").html(tutorial_texts["theuseofthezoom"])
    tutorialContent.append("p").html(tutorial_texts["zoombuttons"])
    var zoomDim = body.select(".leaflet-bar.zoom-buttons").node().getBoundingClientRect();
    var tutorialDim = tutorial.node().getBoundingClientRect();
    tutorial.style("top",(dim.height-tutorialDim.height-43)+"px")
    tutorial.style("left",(dim.width-tutorialDim.width-120)+"px")

    tutorialArrow.style("display",null)
      .style("transform","rotate(90deg)")
      .style("left",(dim.width-100)+"px")
      .style("top",(zoomDim.top+(zoomDim.height/2)-20)+"px")
  });

  var searchBox = body.select(".search-wrapper > .search-box");
  if(!searchBox.empty() && searchBox.node().offsetWidth){
    steps.push(function(){
      var searchDim = searchBox.node().getBoundingClientRect();
      tutorial.style("left",Math.max(60,searchDim.left)+"px")
      tutorial.style("top",(searchDim.bottom+30)+"px")
      tutorialContent.selectAll("*").remove()
      tutorialContent.append("p").html(tutorial_texts['tofindaspecificelement'])
      tutorialContent.append("p").html(tutorial_texts['todomultiplesearches'])

      tutorialArrow.style("display",null)
        .style("transform",null)
        .style("left",(searchDim.left+(searchDim.width/2))+"px")
        .style("top",searchDim.bottom+"px")
    });
  }

  var toolsPanel = body.select(".tools-panel");
  if(!toolsPanel.empty() && toolsPanel.node().offsetWidth){
    steps.push(function(){
      var toolsDim = toolsPanel.node().getBoundingClientRect();
      tutorialContent.selectAll("*").remove()
      tutorialArrow.style("display",null)
        .style("transform","rotate(-90deg)")
        .style("left",(toolsDim.right+40)+"px")
        .style("top",(toolsDim.top)+"px")
      tutorial.style("left",(toolsDim.right+50)+"px")
      tutorial.style("top",(60)+"px")
      tutorialContent.append("p").html(tutorial_texts['toolsmenu'])
      var ul = tutorialContent.append("ul")
      ul.append("li").append("p").html(tutorial_texts['toolsmenu1'])
      ul.append("li").append("p").html(tutorial_texts['toolsmenu2'])
      ul.append("li").append("p").html(tutorial_texts['toolsmenu3'])
      ul.append("li").append("p").html(tutorial_texts['toolsmenu4'])
    });
  }

  var legendsPanel = body.select(".legends-panel-wrapper > .legends-panel");
  if(legendsPanel.empty() || !legendsPanel.node().offsetWidth){
    legendsPanel = body.select(".legends-panel-wrapper > .show-panel-button");
  }
  if(!legendsPanel.empty() && legendsPanel.node().offsetWidth){
    steps.push(function(){
      var legendDim = legendsPanel.node().getBoundingClientRect();
      tutorialContent.selectAll("*").remove()
      tutorialContent.append("p").html(tutorial_texts['figurescanalsobefiltered'])
      var tutorialDim = tutorial.node().getBoundingClientRect();
      tutorialArrow.style("display",null)
        .style("transform","rotate(90deg)")
        .style("left",(dim.width-legendDim.width-50)+"px")
        .style("top",(-30 + legendDim.top + legendDim.height/2)+"px")
      tutorial.style("left",(dim.width-legendDim.width-tutorialDim.width-50)+"px")
      tutorial.style("top",(legendDim.top)+"px")
    });
  }

  var buttonsPanel = body.select(".buttons-panel");
  if(!buttonsPanel.empty() && buttonsPanel.node().offsetWidth){
    steps.push(function(){
      var min = Infinity, max = -Infinity;
      buttonsPanel.selectAll(".buttons-panel > img").each(function(){
        min = Math.min(min,this.getBoundingClientRect().left);
        max = Math.max(max,this.getBoundingClientRect().right);
      })
      var left = (min + max) / 2,
          top = buttonsPanel.node().getBoundingClientRect().top;

      tutorialContent.selectAll("*").remove()
      tutorialContent.append("p").html('<span class="highlight">'+tutorial_texts["otherfunctions"]+':</span>')
      var ul = tutorialContent.append("ul")
               .attr("class","ul-table")
      if(!buttonsPanel.select(".buttons-panel > img.frequencies-button").empty()){
        ul.append("li").html('<span>'+tutorial_texts["statisticalgraphs"]+'</span><span><img src="'+b64Icons.chart+'"/></span>')
      }
      ul.append("li").html('<span>'+tutorial_texts["informativetables"]+'</span><span><img src="'+b64Icons.table+'"/></span>')
      tutorial.style("left",30+"px")
      tutorial.style("top",(top-tutorial.node().getBoundingClientRect().height-30)+"px")

      tutorialArrow.style("display",null)
      .style("transform","rotate(180deg)")
      .style("left",left+"px")
      .style("top",(top-tutorialArrow.node().getBoundingClientRect().height)+"px")
    });
  }

  // multipages
  if(options.multipages){
    steps.push(function(){
      tutorialContent.selectAll("*").remove();
      var multigraphDim = body.select("#Wrapper > .topbar > .primary.home").node().getBoundingClientRect();
      tutorial.style("top",(multigraphDim.bottom+40)+"px")
      tutorial.style("left",multigraphDim.left+"px")
      tutorialContent.append("p").html(tutorial_texts['inadditiontothispage'])
      tutorialContent.append("p").html(tutorial_texts['tonavigatefromonetoanother'])

      tutorialArrow.style("display",null)
        .style("transform",null)
        .style("left",(multigraphDim.left+(multigraphDim.width/2))+"px")
        .style("top",(multigraphDim.bottom+10)+"px")
      tutorial2.style("display","none")
    });
  }

  go2step(0);

  function tutorial_menu(){
    tutorial.remove();
    tutorial2.remove();
    tutorialArrow.remove();
    var tutorialIcon = body.select("#Wrapper > .topbar").append("div")
      .attr("class","tutorial-icon")
      .on("click",function(){
        tutorialIcon.remove();
        tutorial = body.select("body > .tutorial");
        if(tutorial.empty()){
          tutorial = body.append("div")
          .attr("class","tutorial")
          .style("top",60+"px")
          .style("right",60+"px")
          .style("width",240+"px")
          tutorial.append("p").text(tutorial_texts['hello'])
          tutorial.append("p").text(tutorial_texts['doyouneedhelp'])
          tutorial
          .append("button")
            .attr("class","primary")
            .style("width","100%")
            .text(tutorial_texts['seethetutorials'])
            .on("click",function(){
              tutorialTour(options);
            })
          tutorial.append("p")
        }else{
          tutorial.remove();
        }
      })
  }

  function updateButtons(c,l){
    if(c){
      tutorialButtons.select(".prev").style("visibility",null);
    }else{
      tutorialButtons.select(".prev").style("visibility","hidden");
    }
    if(c==(l-1)){
      tutorialButtons.select(".skip").text(tutorial_texts['closetutorial']).style("float","right");
      tutorialButtons.select(".next").style("display","none");
    }else{
      tutorialButtons.select(".skip").text(tutorial_texts['skiptutorial']).style("float",null);
      tutorialButtons.select(".next").style("display",null);
    }
  }

  function go2step(i){
    steps[i]();
    updateButtons(i,steps.length);
  }
}

