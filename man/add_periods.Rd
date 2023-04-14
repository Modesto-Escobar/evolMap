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
  description = NULL, popup = FALSE, duration = NULL, periodrep = TRUE)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{periods}{a period data frame defining periods with the following columns: name, start and end.}
\item{name}{name of the column with names in the period data frame (first column by default).}
\item{start}{name of the column with the start time of a period in the period data frame (second column by default).}
\item{end}{name of the column with the end time of a period in the period data frame (third column by default).}
\item{latitude}{name of the column with the latitude coordinates to center zoom on each period.}
\item{longitude}{name of the column with the longitude coordinates for center zoom in each period.}
\item{zoom}{name of the column with the zoom size to display each period.}
\item{description}{name of the column with the description of each period.}
\item{popup}{should the description be displayed as a popup?.}
\item{duration}{name of the column with the period duration in seconds.}
\item{periodrep}{If false, time will run by year, and the period will only be shown in the header. Otherwise, time will run by period.}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
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
  period = "generation", markerCluster = FALSE)

periods <- data.frame(
name = c("1775-1799","1800-1824","1825-1850","1851-1874"),
start = c(1775,1800,1825,1851),
end = c(1799,1824,1850,1874)
)
map <- add_periods(map, periods)

\donttest{
# plot map
plot(map)
}
}
