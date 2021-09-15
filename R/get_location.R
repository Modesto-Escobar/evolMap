get_location <- function(x){
  if(length(x)>1){
    locations <- list()
    for(place in unique(x)){
      locations[[place]] <- get_location(place)
    }
    layout <- sapply(x,function(x){ locations[[x]] })
    layout <- cbind(layout[1,],layout[2,])
    return(layout)
  }else{
    if(length(x) && !is.na(x) && x!=""){
      url <- paste0("https://nominatim.openstreetmap.org/search?q=",x,"&format=json")
      tmp <- NULL
      tryCatch({
        tmp <- curl::curl_download(url,tempfile())
      }, error=function(cond){
        warning(paste0("Problems with '",x,"' -> ",cond))
      })
      if(length(tmp)){
        content <- scan(file = tmp, what = character(0), sep = "\n", quiet = TRUE)
        json <- fromJSON(paste0(content,collapse=""))
        if(length(json)){
          return(c(as.numeric(json$lat[1]),as.numeric(json$lon[1])))
        }
      }
    }
    return(c(NA,NA))
  }
}

