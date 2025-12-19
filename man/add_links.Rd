\name{add_links}
\alias{add_links}
\title{Add links.}
\description{
Add links to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_links(map, links, color = NULL, start = NULL, end = NULL, period = NULL,
  noFilterCols = NULL, curve = TRUE, arrows = FALSE)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{links}{a link data frame with two first columns as source and target marker names (specified with the \code{name} argument in \code{\link{add_markers}}) and any other column with link attributes. Column names can be passed as parameters to the arguments.}
\item{color}{name of the column with color variable in the link data frame.}
\item{start}{name of the column with the start time of a period in the link data frame.}
\item{end}{name of the column with the end time of a period in the link data frame.}
\item{period}{name of the column with the period name in the link data frame.}
\item{noFilterCols}{disable filtering by especified column names.}
\item{curve}{Links will be displayed as a curve.}
\item{arrows}{Links will show an arrow at the end.}
}

\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
}

\examples{
# create data
markers <- data.frame(
  lat=c(39,47,53,40,53),
  lon=c(-5, 2,-8,-8,-1),
  name=c("m1","m2","m3","m4","m5")
)

links <- data.frame(
  source=c("m4","m1","m2","m5"),
  target=c("m1","m2","m5","m3"),
  num=1:4
)

# create map
map <- create_map()
map <- add_markers(map, markers, name="name", color="name", markerCluster=FALSE)
map <- add_links(map, links, color="num")

\donttest{
# plot map
plot(map)
}
}
