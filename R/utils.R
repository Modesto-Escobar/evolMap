categoryColors <- function(items){
    colors1 <- c(
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
    if(!is.numeric(items)){
      items <- as.numeric(as.factor(items))
    }
    items <- ((items-1) %% length(colors1))+1
    return(colors1[items])
}
