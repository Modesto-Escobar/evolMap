\name{create_map}
\alias{create_map}
\title{Interactive map.}
\description{
\code{create_map} produces an interactive map with 'Leaflet'. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
create_map(data, latitude = NULL, longitude = NULL,
  links = NULL, name = NULL,
  label = NULL, image = NULL, color = NULL, info = NULL,
  start = NULL, end = NULL,
  geojson = NULL, markerCluster = TRUE, provider = "OpenStreetMap",
  jitteredPoints = FALSE)
}
\arguments{
\item{data}{a data frame with the locations and information to show in each one. Column names can be passed as parameter to the arguments.}
\item{latitude}{name of the column with the latitude coordinates for each marker (first column by default).}
\item{longitude}{name of the column with the longitude coordinates for each marker (second column by default).}
\item{links}{a data frame with two columns with source and target markers names (specified with the name argument).}
\item{name}{name of the column with names in the markers data frame.}
\item{label}{name of the column with labels in the markers data frame. This information will be shown as a tool tip.}
\item{image}{name of the column with the path to node image files in the data matrix.}
\item{color}{name of the column with color variable in the data matrix.}
\item{info}{name of the column with information to display in a panel in the data matrix.}
\item{start}{name of the column with the start time of a period in the data matrix.}
\item{end}{name of the column with the end time of a period in the data matrix.}
\item{geojson}{character vector with a path to a geojson file or the geojson string to plot.}
\item{markerCluster}{enable joining of nearby markers when zooming out.}
\item{provider}{character string with the map/provider to represent as background, OpenStreetMap by default. See \code{\link{list_providers}} for available maps/providers.}
\item{jitteredPoints}{Add a small amount of noise to markers to avoid overlapping.}
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
map <- create_map(sociologists,
  latitude = "latitude", longitude = "longitude",
  label = "label", image = "picture",
  start = "birth", end = "death")

\dontrun{
# plot map
plot(map)
}
}
