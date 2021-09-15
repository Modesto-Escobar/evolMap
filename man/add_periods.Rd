\name{add_periods}
\alias{add_periods}
\title{Add Periods.}
\description{
Add periods to the interactive map. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_periods(map, periods, name = NULL, start = NULL, end = NULL,
  latitude = NULL, longitude = NULL, zoom = NULL,
  description = NULL, duration = NULL,
  periodInItems = NULL, periodrep = TRUE)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{periods}{a data frame defining periods with the following columns: name, start and end.}
\item{name}{name of the column with names in the periods data frame (first column by default).}
\item{start}{name of the column with the start time of a period in the data frame (second column by default).}
\item{end}{name of the column with the end time of a period in the data frame (third column by default).}
\item{latitude}{name of the column with the latitude coordinates for center zoom in each period.}
\item{longitude}{name of the column with the longitude coordinates for center zoom in each period.}
\item{zoom}{name of the column with the zoom to display each period.}
\item{description}{name of the column with a description of each period.}
\item{duration}{name of the column with a period duration in seconds.}
\item{periodInItems}{name of the column with the period of each item (markers, entities and links). By default, period is calculated by the item date.}
\item{periodrep}{Should time run by period? If false, time will run by year, the period only will be shown in header.}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
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
  start = "birth", end = "death",
  markerCluster = FALSE)

periods <- data.frame(
name = c("1775-1799","1800-1824","1825-1850","1851-1874"),
start = c(1775,1800,1825,1851),
end = c(1799,1824,1850,1874)
)
map <- add_periods(map, periods, periodInItems = "generation")

\dontrun{
# plot map
plot(map)
}
}
