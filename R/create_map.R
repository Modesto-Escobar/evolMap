create_map <- function(markers, locations,
  links = NULL, name = NULL, source = NULL, target = NULL,
  label = NULL, image = NULL, color = NULL, info = NULL,
  start = NULL, end = NULL,
  geojson = NULL, markerCluster = TRUE, provider = "OpenStreetMap",
  jitteredPoints = FALSE, directory = NULL){

options <- list()

if(!is.null(name)){
  markers$name <- as.character(markers[[name]])
  if(is.null(source)){
    source <- 1
  }
  if(is.null(target)){
    target <- 2
  }
  links <- data.frame(source=links[[source]], target=links[[target]])
}else if(!is.null(links)){
  links <- NULL
  warning("You must provide 'name' in order to identify each link with his markers")
}

if(!is.null(markerCluster) && markerCluster){
  options$markerCluster <- TRUE
}
if(!is.null(provider)){
  options$provider <- provider
}

if(!is.null(label)){
  markers$label <- markers[[label]]
}
if(!is.null(image)){
  markers$image <- markers[[image]]
  if(!is.null(color)){
    color <- NULL
    warning("images and colors cannot be set at the same time")
  }
}
if(!is.null(color)){
  markers$color <- categoryColors(markers[[color]])
}
if(!is.null(info)){
  markers$info <- markers[[info]]
}

if(!is.null(start) || !is.null(end)){
    options$time <- "numeric"
    isPOSIXct <- TRUE
    if(!is.null(start)){
      if(inherits(markers[[start]],"Date")){
        markers[[start]] <- as.POSIXct(markers[[start]])
      }
      if(!inherits(markers[[start]],"POSIXct")){
        isPOSIXct <- FALSE
      }
    }
    if(!is.null(end)){
      if(inherits(markers[[end]],"Date")){
        markers[[end]] <- as.POSIXct(markers[[end]])
      }
      if(!inherits(markers[[end]],"POSIXct")){
        isPOSIXct <- FALSE
      }
    }
    if(isPOSIXct){
      options$time <- "POSIXct"
    }
    if(!is.null(start)){
      markers$start <- as.numeric(markers[[start]])
    }else{
      markers$start <- min(as.numeric(markers[[end]]))
    }
    if(!is.null(end)){
      markers$end <- as.numeric(markers[[end]])
    }else{
      markers$end <- max(as.numeric(markers[[start]]))
    }
}

markers$x <- locations[,1]
markers$y <- locations[,2]
if(jitteredPoints){
  markers$x <- jitter(markers$x, amount = 0.01)
  markers$y <- jitter(markers$y, amount = 0.01)
}

keepmarkers <- markers[!is.na(locations[,1]) & !is.na(locations[,2]),intersect(c("name","label","image","color","info","start","end","x","y"),colnames(markers))]

if(!is.null(options$time)){
  options$time <- c(min(keepmarkers$start,na.rm=TRUE), max(keepmarkers$end,na.rm=TRUE), options$time)
}

objlist <- list(markers=keepmarkers, options=options)
if(!is.null(links)){
  links <- links[links$source %in% keepmarkers$name & links$target %in% keepmarkers$name,]
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

  if("image" %in% colnames(object$markers)){
    dir.create(paste0(directory,"/images"))
    for(i in seq_along(object$markers$image)){
      imagefile <- object$markers$image[i]
      file.copy(imagefile,paste0(directory,"/images/",basename(imagefile)))
    }
  }

  #prepare data and parse to json
  data <- list(markers=unname(as.list(object$markers)), markernames = colnames(object$markers), options=object$options)

  #prepare links
  if(length(object$links)){
    idx <- seq_along(object$markers$name)-1
    names(idx) <- as.character(object$markers$name)

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
  printTable(x$markers,"Markers")
}

plot.evolMap <- function(x, directory = tempdir(), ...){
  map_html(x, directory)
  browseURL(normalizePath(paste(directory, "index.html", sep = "/")))
}
