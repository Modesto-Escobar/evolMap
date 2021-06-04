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
create_map(markers, locations,
  links = NULL, name = NULL, source = NULL, target = NULL,
  label = NULL, image = NULL, color = NULL, info = NULL,
  start = NULL, end = NULL,
  geojson = NULL, markerCluster = TRUE, provider = "OpenStreetMap",
  jitteredPoints = FALSE, directory = NULL)
}
\arguments{
\item{markers}{a data frame with at least one column of item names.}
\item{locations}{a matrix with two columns with latitude/logitude coordinates}
\item{links}{a data frame with at least two columns with source and target node names.}
\item{name}{name of the column with names in the markers data frame.}
\item{source}{name of the column with source names in the links data frame.}
\item{target}{name of the column with target names in the links data frame.}
\item{label}{name of the column with labels in the markers data frame.}
\item{image}{name of the column with the path to node image files in the markers data frame.}
\item{color}{name of the column with color variable in the markers data frame.}
\item{info}{name of the column with information to display in a panel in the markers data frame.}
\item{start}{name of the column with starts in the markers data frame.}
\item{end}{name of the column with ends in the markers data frame.}
\item{geojson}{character vector of geojson strings or files.}
\item{markerCluster}{enable animated marker clustering functionality.}
\item{provider}{add a tile layer from a known map provider. See \code{\link{list_providers}}.}
\item{jitteredPoints}{Add a small amount of noise to markers.}
\item{directory}{a character string representing the directory where the web files will be saved.}
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

# create map
map <- create_map(sociologists, locations,
  label="label", image="picture",
  start = "birth", end = "death")

\dontrun{
# plot map
plot(map)
}
}
