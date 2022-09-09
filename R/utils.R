DFcolumnTypes <- function(df){
  types <- rep("string",ncol(df))
  isnum <- vapply(df,is.numeric,logical(1))
  types[isnum] <- "number"
  isobject <- vapply(df,function(x){
    return(is.character(x) && !all(sapply(strsplit(x,"|",fixed=TRUE),function(x){ return(!length(x)>1) })))
  },logical(1))
  types[isobject] <- "object"
  return(types)
}

DFdecompose <- function(df){
  return(list(columns = colnames(df), data = unname(as.list(df)), types = DFcolumnTypes(df)))
}

capitalize <- function(word){
  return(paste0(toupper(substr(word,1,1)),tolower(substr(word,2,nchar(word)))))
}

symbolTypes <- function(){
  return(c(
    "Circle",
    "Square",
    "Diamond",
    "Triangle",
    "Cross",
    "Star",
    "Wye"
  ))
}

isShape <- function(shape){
  shape <- capitalize(shape)
  shapes1 <- symbolTypes()
  comp <- sapply(shape,function(x){ return(x %in% shapes1) })
  if(all(comp)){
    return(TRUE)
  }
  return(FALSE)
}

getShapes <- function(items){
  shapes1 <- symbolTypes()
  if(!is.numeric(items)){
    items <- as.numeric(as.factor(items))
  }
  items <- ((items-1) %% length(shapes1))+1
  return(shapes1[items])
}

isColor <- function(color){
  if(!length(color)){
    return(FALSE)
  }
  return(tryCatch({
    col2rgb(color)
    return(TRUE)
  }, error=function(cond){
    return(FALSE)
  }))
}

col2hex <- function(color){
  return(apply(col2rgb(color),2,function(x){
    tolower(rgb(x[1],x[2],x[3],maxColorValue=255))
  }))
}

categoryColors <- c(
  "#1f77b4", # blue
  "#ff7f0e", # orange
  "#2ca02c", # green
  "#e377c2", # pink
  "#d62728", # red
  "#bcbd22", # lime
  "#9467bd", # purple
  "#8c564b", # brown
  "#7f7f7f", # grey
  "#17becf", # cyan
  "#aec7e8", # light blue
  "#ffbb78", # light orange
  "#98df8a", # light green
  "#f7b6d2", # light pink
  "#ff9896", # light red
  "#dbdb8d", # light lime
  "#c5b0d5", # light purple
  "#c49c94", # light brown
  "#c7c7c7", # light grey
  "#9edae5" # light cyan
    )

colorScales <- list(
  "WhGn" = c("#ffffff","#2ca02c"),
  "GnWh" = c("#2ca02c","#ffffff"),
  "WhRd" = c("#ffffff","#d62728"),
  "RdWh" = c("#d62728","#ffffff"),
  "WhBk" = c("#ffffff","#000000"),
  "BkWh" = c("#000000","#ffffff"),
  "WhBu" = c("#ffffff","#1f77b4"),
  "BuWh" = c("#1f77b4","#ffffff"),
  "GnWhRd" = c("#2ca02c","#ffffff","#d62728"),
  "RdWhGn" = c("#d62728","#ffffff","#2ca02c"),
  "BkWhRd" = c("#000000","#ffffff","#d62728"),
  "RdWhBk" = c("#d62728","#ffffff","#000000"),
  "BuWhRd" = c("#1f77b4","#ffffff","#d62728"),
  "RdWhBu" = c("#d62728","#ffffff","#1f77b4"),
  "YlWhBu" = c("#bcbd22","#ffffff","#1f77b4"),
  "BuWhYl" = c("#1f77b4","#ffffff","#bcbd22"),
  "GnBkRd" = c("#2ca02c","#000000","#d62728"),
  "RdBkGn" = c("#d62728","#000000","#2ca02c"),
  "BkRd" = c("#000000","#d62728"),
  "RdBk" = c("#d62728","#000000"),
  "BuRd" = c("#1f77b4","#d62728"),
  "RdBu" = c("#d62728","#1f77b4"),
  "YlBu" = c("#bcbd22","#1f77b4"),
  "BuYl" = c("#1f77b4","#bcbd22"),
  "BuGn" = c("#6720d6", "#0bd638"),
  "PiGn" = c("#d6249d", "#70d661"),
  "YlPi" = c("#d6c30c", "#8a013c"),
  "BuPi" = c("#24d6c0", "#d618cc"),
  "OrPu" = c("#d68706", "#811cd6"),
  "PiWh" = c("#d618cc", "#ffffff"),
  "OrWh" = c("#d68d01", "#ffffff"),
  "YlWh" = c("#d6d31f", "#ffffff")
)

applyCategoryColors <- function(items){
    if(!is.numeric(items)){
      items <- as.numeric(as.factor(items))
    }
    items <- ((items-1) %% length(categoryColors))+1
    return(categoryColors[items])
}

checkItemValue <- function(object,items,itemprop,value,propName,checkProp,autoProp,sanitize){
    if(!length(object[[items]]) || is.null(value)){
      object$options[[itemprop]] <- NULL
      return(object)
    }

    prepareVar <- function(var){
          if(is.numeric(var) || is.factor(var)){
            var <- autoProp(var)
          }else if(is.character(var) && checkProp(var)){
            var <- sanitize(var)
          }else{
            var <- NULL
            warning(paste0(propName,": this value cannot be a ",propName))
          }
          return(var)
    }

    if(is.list(value) && !is.data.frame(value)){
      checkedlist <- list()
      for(k in names(value)){
        if(!k %in% colnames(object[[items]]) || !(is.character(object[[items]][[k]]) || is.factor(object[[items]][[k]]))){
          warning(paste0(propName,": the names in the list must match character columns of the nodes, but '",k,"' doesn't"))
        }else{
          if(!is.character(value[[k]]) || is.null(names(value[[k]]))){
            warning(paste0(propName,": each item in the list must be a named character vector describing value-",propName,", but '",k,"' doesn't"))
          }else{
            checkedlist[[k]] <- unname(value[[k]][object[[items]][[k]]])
          }
        }
      }
      if(length(checkedlist)){
        value <- as.data.frame(checkedlist)
      }else{
        value <- NULL
      }
    }

    if(is.matrix(value) || is.data.frame(value)){
      if(nrow(value)==nrow(object[[items]])){
        for(k in colnames(value)){
          var <- prepareVar(value[[k]])
          if(!is.null(var)){
            if(k %in% colnames(object[[items]])){
              itemlegend <- as.character(object[[items]][[k]])
            }else{
              itemlegend <- as.character(value[[k]])
            }
            object[[items]][[k]] <- itemlegend
            object[[items]][[paste0("_",itemprop,"_",k)]] <- var
          }
        }
        object$options[[itemprop]] <- colnames(value)[1]
      }else{
        warning(paste0(propName,": number of rows doesn't match with ",items))
      }
    }else if(length(value)==1 && (value %in% colnames(object[[items]]))){
      object$options[[itemprop]] <- value
    }else if(length(value)>1 || checkProp(value)){
        if(length(value)==1){
          value <- rep(value,nrow(object[[items]]))
        }
        if(length(value)==nrow(object[[items]])){
          if(!is.null(names(value))){
            itemlegend <- names(value)
          }else{
            itemlegend <- as.character(value)
          }
          value <- prepareVar(value)
          if(!is.null(value)){
            object[[items]][[paste0("-",itemprop,"-")]] <- itemlegend
            object[[items]][[paste0("_",itemprop,"_-",itemprop,"-")]] <- value
            object$options[[itemprop]] <- paste0("-",itemprop,"-")
          }
        }else{
          warning(paste0(propName,": length doesn't match with ",items,"' number of rows"))
        }
    }else{
      warning(paste0(propName,": invalid value '",value,"'"))
      object$options[[itemprop]] <- NULL
    }
    return(object)
}

checkTime <- function(object,items,start,end){
if(!is.null(object[[items]]) && (!is.null(start) || !is.null(end))){
    dateclass <- dateclass1 <- dateclass2 <- "numeric"
    if(length(object$options$time)){
      min0 <- object$options$time$min
      max0 <- object$options$time$max
    }else{
      min0 <- Inf
      max0 <- -Inf
    }
    if(!is.null(start)){
      dateclass1 <- class(object[[items]][[start]])[1]
      object[[items]][[start]] <- as.numeric(object[[items]][[start]])
    }else{
      start <- "_start_"
      object[[items]][[start]] <- min(as.numeric(object[[items]][[end]]), min0)
      dateclass1 <- dateclass2
    }
    if(!is.null(end)){
      dateclass2 <- class(object[[items]][[end]])[1]
      object[[items]][[end]] <- as.numeric(object[[items]][[end]])
    }else{
      end <- "_end_"
      object[[items]][[end]] <- max(as.numeric(object[[items]][[start]]), max0)
      dateclass2 <- dateclass1
    }
    if((dateclass1==dateclass2) && (dateclass1 %in% c("Date","POSIXct"))){
      dateclass <- dateclass1
    }
    min1 = min(object[[items]][[start]],na.rm=TRUE)
    max1 = max(object[[items]][[end]],na.rm=TRUE)

    if(!is.null(object$options$time) && (object$options$start != start || object$options$end != end || object$options$time$type!=dateclass)){
      warning("New time parameters not matching with previous")
    }else{
      object$options$start <- start
      object$options$end <- end

      object[[items]] <- object[[items]][order(object[[items]][[start]],object[[items]][[end]]),]
      object$options$time <- list(min=min(min1,min0), max=max(max1,max0), type=dateclass)
    }
}
  return(object)
}

check_utf8 <- function(text){
    enc <- Encoding(text)
    if(enc=="latin1" || (l10n_info()[["Latin-1"]] && enc=="unknown")){
      Encoding(text) <- "latin1"
      text <- enc2utf8(text)
    }
    return(text)
}

getRawName <- function(filepath){
  filename <- strsplit(basename(filepath), split="\\.")[[1]]
  ext <- filename[length(filename)]
  filename <- paste0(filename[-length(filename)],collapse=".")
  return(paste(paste0(as.character(charToRaw(filename)),collapse=""),ext,sep="."))
}

cleanNames <- function(names){
  return(gsub("|","_",as.character(names),fixed=TRUE))
}

checkLanguage <- function(language){
  if(!length(language)){
    language <- "en"
  }else{
    language <- language[1]
    if(!(language %in% c("en","es","ca"))){
      warning(paste0("language: '",language,"' is not supported"))
      language <- "en"
    }
  }
  return(language)
}

base64encode <- function(filename) {
  to.read = file(filename, "rb")
  fsize <- file.size(filename)
  sbit <- readBin(to.read, raw(), n = fsize, endian = "little")
  close(to.read)
  b64c <- "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  shfts <- c(18,12,6,0)
  sand <- function(n,s) bitwAnd(bitwShiftR(n,s),63)+1
  slft <- function(p,n) bitwShiftL(as.integer(p),n)
  subs <- function(s,n) substring(s,n,n)
  npad <- ( 3 - length(sbit) %% 3) %% 3
  sbit <- c(sbit,as.raw(rep(0,npad)))
  pces <- lapply(seq(1,length(sbit),by=3),function(ii) sbit[ii:(ii+2)])
  encv <- paste0(sapply(pces,function(p) paste0(sapply(shfts,function(s)(subs(b64c,sand(slft(p[1],16)+slft(p[2],8)+slft(p[3],0),s)))))),collapse="")
  if (npad > 0) substr(encv,nchar(encv)-npad+1,nchar(encv)) <- paste0(rep("=",npad),collapse="")
  return(encv)
}

