\name{get_location}
\alias{get_location}
\title{Get location coordinates.}
\description{
\code{get_location} returns the latitude and longitude of each input place name. 
}
\value{
Matrix with the latitude and longitude coordinates of each input place.
}

\usage{
get_location(x)
}
\arguments{
\item{x}{a vector String with place names whose coordinates are downloaded from OpenStreetMap.}
}
\author{
Modesto Escobar, Department of Sociology and Communication, University of Salamanca.
}
\examples{
get_location(c("Salamanca, Spain","New York, United States"))
}
