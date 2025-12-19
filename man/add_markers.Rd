\name{add_markers}
\alias{add_markers}
\title{Add markers.}
\description{
Add markers to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_markers(map, data, latitude = NULL, longitude = NULL, name = NULL,
  label = NULL, image = NULL, size = NULL, color = NULL, shape = NULL,
  text = NULL, info = NULL, infoFrame = NULL, rightFrameWidth = NULL,
  start = NULL, end = NULL, period = NULL,
  noFilterCols = NULL, markerCluster = FALSE, roundedIcons = TRUE,
  jitteredPoints = 0, coords = FALSE)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{data}{a marker data frame with the locations and information to show in each marker. Its column names can be passed as parameters to the arguments of the function.}
\item{latitude}{name of the column with the latitude coordinates for each marker (first column by default).}
\item{longitude}{name of the column with the longitude coordinates for each marker (second column by default).}
\item{name}{name of the column with names in the marker data frame.}
\item{label}{name of the column with labels in the marker data frame.}
\item{image}{name of the column with the path to marker image files in the marker data frame.}
\item{size}{name of the column with size in the nodes data frame.}
\item{color}{name of the column with color variable in the marker data frame.}
\item{shape}{name of the column with shape variable in the marker data frame.}
\item{text}{name of the column with texts in the marker data frame. This information will be shown as a popup.}
\item{info}{name of the column with information to display in a panel in the marker data frame.}
\item{infoFrame}{Deprecated. Replaced by argument \code{infoFrame} in \code{add_description} function.}
\item{rightFrameWidth}{Deprecated. Replaced by argument \code{frameWidth} in \code{create_map} function.}
\item{start}{name of the column with the start time of a period in the marker data frame.}
\item{end}{name of the column with the end time of a period in the marker data frame.}
\item{period}{name of the column with the period name in the marker data frame.}
\item{noFilterCols}{disable filtering by especified column names.}
\item{markerCluster}{enable joining of nearby markers when zooming out.}
\item{roundedIcons}{display markers with rounded borders.}
\item{jitteredPoints}{add an amount of noise to markers to avoid overlapping.}
\item{coords}{should coordinates (latitude and longitude) must be shown in the table and filters? (FALSE by default)}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
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

\donttest{
# plot map
plot(map)
}
}
