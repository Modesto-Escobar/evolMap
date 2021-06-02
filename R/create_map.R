create_map <- function(items, layout,
  links = NULL, name = NULL, source = NULL, target = NULL,
  label = NULL, image = NULL, color = NULL, info = NULL,
  start = NULL, end = NULL,
  geojson = NULL, markerCluster = TRUE, provider = "OpenStreetMap",
  jitteredPoints = FALSE, directory = NULL){

options <- list()

if(!is.null(name)){
  items$name <- as.character(items[[name]])
  if(is.null(source)){
    source <- 1
  }
  if(is.null(target)){
    target <- 2
  }
  links <- data.frame(source=links[[source]], target=links[[target]])
}else if(!is.null(links)){
  links <- NULL
  warning("You must provide 'name' in order to identify each link with his items")
}

if(!is.null(markerCluster) && markerCluster){
  options$markerCluster <- TRUE
}
if(!is.null(provider)){
  options$provider <- provider
}

if(!is.null(label)){
  items$label <- items[[label]]
}
if(!is.null(image)){
  items$image <- items[[image]]
  if(!is.null(color)){
    color <- NULL
    warning("images and colors cannot be set at the same time")
  }
}
if(!is.null(color)){
  items$color <- categoryColors(items[[color]])
}
if(!is.null(info)){
  items$info <- items[[info]]
}

if(!is.null(start) || !is.null(end)){
    options$time <- "numeric"
    isPOSIXct <- TRUE
    if(!is.null(start)){
      if(inherits(items[[start]],"Date")){
        items[[start]] <- as.POSIXct(items[[start]])
      }
      if(!inherits(items[[start]],"POSIXct")){
        isPOSIXct <- FALSE
      }
    }
    if(!is.null(end)){
      if(inherits(items[[end]],"Date")){
        items[[end]] <- as.POSIXct(items[[end]])
      }
      if(!inherits(items[[end]],"POSIXct")){
        isPOSIXct <- FALSE
      }
    }
    if(isPOSIXct){
      options$time <- "POSIXct"
    }
    if(!is.null(start)){
      items$start <- as.numeric(items[[start]])
    }else{
      items$start <- min(as.numeric(items[[end]]))
    }
    if(!is.null(end)){
      items$end <- as.numeric(items[[end]])
    }else{
      items$end <- max(as.numeric(items[[start]]))
    }
}

items$x <- layout[,1]
items$y <- layout[,2]
if(jitteredPoints){
  items$x <- jitter(items$x, amount = 0.01)
  items$y <- jitter(items$y, amount = 0.01)
}

keepitems <- items[!is.na(layout[,1]) & !is.na(layout[,2]),intersect(c("name","label","image","color","info","start","end","x","y"),colnames(items))]

if(!is.null(options$time)){
  options$time <- c(min(keepitems$start,na.rm=TRUE), max(keepitems$end,na.rm=TRUE), options$time)
}

objlist <- list(items=keepitems, options=options)
if(!is.null(links)){
  links <- links[links$source %in% keepitems$name & links$target %in% keepitems$name,]
  if(nrow(links)){
    objlist$links <- links
  } 
}
if(!is.null(geojson)){
  if(is.character(geojson)){
    for(i in seq_along(geojson)){
      if(file.exists(geojson[i])){
        geojson[i] <- paste0(scan(file = geojson[i], what = character(0), sep = "\n", quiet = TRUE),collapse="")
      }
    }
    objlist$geojson <- geojson
  }else{
    warning("geojson: must be a character vector")
  }
}
object <- structure(objlist, class="evolMap")

if(!is.null(directory)){
  map_html(object, directory)
}

  return(object)
}

map_html <- function(object, directory){
  styles <- c("leaflet.css", "styles.css")
  scripts <- c("leaflet.js", "leaflet-providers.js", "create_map.js")
  if(!is.null(object$options$markerCluster) && object$options$markerCluster){
    styles <- c("leaflet.css", "MarkerCluster.css", "MarkerCluster.Default.css", "styles.css")
    scripts <- c("leaflet.js", "leaflet-providers.js", "leaflet.markercluster.js", "create_map.js")
  }

  unlink(directory,recursive=TRUE)
  dir.create(directory)

  if("image" %in% colnames(object$items)){
    dir.create(paste0(directory,"/images"))
    for(i in seq_along(object$items$image)){
      imagefile <- object$items$image[i]
      file.copy(imagefile,paste0(directory,"/images/",basename(imagefile)))
    }
  }

  #prepare data and parse to json
  data <- list(items=unname(as.list(object$items)), itemnames = colnames(object$items), options=object$options)

  #prepare links
  if(length(object$links)){
    idx <- seq_along(object$items$name)-1
    names(idx) <- as.character(object$items$name)

    source <- idx[as.character(object$links$source)]
    target <- idx[as.character(object$links$target)]

    data$links <- list(source, target)
  }

  json <- toJSON(data,na='null')
  write(paste0("var data = ",json,";"),file=paste0(directory,"/data.js"))

  www <- system.file("www",package="evolMap")

  dir.create(paste0(directory,"/lib"))

  indexhtml <- c('<!DOCTYPE html>',
'<html>',
'<head>',
'<meta charset="UTF-8">',
paste0('<title>',basename(directory),'</title>'))
for(style in styles){
  file.copy(paste0(www,"/",style),paste0(directory,"/lib"))
  indexhtml <- c(indexhtml,paste0('<link rel="stylesheet" href="lib/',style,'" />'))
}
for(script in scripts){
  file.copy(paste0(www,"/",script),paste0(directory,"/lib"))
  indexhtml <- c(indexhtml,paste0('<script src="lib/',script,'"></script>'))
}
indexhtml <- c(indexhtml, '<script src="data.js"></script>')
if(length(object$geojson)){
  write(paste0("var geojson = [",paste0(object$geojson,collapse=","),"];"),file=paste0(directory,"/geojson.js"))
  indexhtml <- c(indexhtml, '<script src="geojson.js"></script>')
}
indexhtml <- c(indexhtml,
'</head>',
'<body>',
'<div id="mapid"></div>',
'</body>',
'</html>')

  write(paste0(indexhtml,collapse="\n"),paste0(directory,"/index.html"))
}

printTable <- function(x, name){
  cat("\n",name,"(",nrow(x),"):\n",sep="")
  row.names(x)<-NULL
  print(as.data.frame(head(x)),row.names=F)
  if (nrow(x)>6) cat("...\n")
}

print.evolMap <- function(x, ...) {
  printTable(x$items,"Items")
}

plot.evolMap <- function(x, directory = tempdir(), ...){
  map_html(x, directory)
  browseURL(normalizePath(paste(directory, "index.html", sep = "/")))
}
