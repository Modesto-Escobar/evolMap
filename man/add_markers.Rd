\name{add_markers}
\alias{add_markers}
\title{Add Markers.}
\description{
Add markers to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_markers(map, data, latitude = NULL, longitude = NULL, name = NULL,
  label = NULL, image = NULL, color = NULL, shape = NULL, text = NULL,
  info = NULL, start = NULL, end = NULL, period = NULL,
  markerCluster = FALSE, jitteredPoints = 0)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{data}{a data frame with the locations and information to show in each one. Column names can be passed as parameter to the arguments.}
\item{latitude}{name of the column with the latitude coordinates for each marker (first column by default).}
\item{longitude}{name of the column with the longitude coordinates for each marker (second column by default).}
\item{name}{name of the column with names in the markers data frame.}
\item{label}{name of the column with labels in the markers data frame.}
\item{image}{name of the column with the path to node image files in the data matrix.}
\item{color}{name of the column with color variable in the data matrix.}
\item{shape}{name of the column with shape variable in the data matrix.}
\item{text}{name of the column with texts in the markers data frame. This information will be shown as a popup.}
\item{info}{name of the column with information to display in a panel in the data matrix.}
\item{start}{name of the column with the start time of a period in the data matrix.}
\item{end}{name of the column with the end time of a period in the data matrix.}
\item{period}{name of the column with the period name in the data matrix.}
\item{markerCluster}{enable joining of nearby markers when zooming out.}
\item{jitteredPoints}{Write an amount of noise to markers to avoid overlapping.}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
# load data
data(sociologists)
data(locations)

# load pictures
sociologists$picture <- system.file("extdata", sociologists$picture,
  package="evolMap")

# join locations
sociologists$latitude <- locations[,1]
sociologists$longitude <- locations[,2]

# create map
map <- create_map()
map <- add_markers(map, sociologists,
  latitude = "latitude", longitude = "longitude",
  label = "label", image = "picture",
  start = "birth", end = "death")

\dontrun{
# plot map
plot(map)
}
}
