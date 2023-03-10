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
\item{x}{a vector string with place names ("city, country") whose coordinates will be downloaded from OpenStreetMap.}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
}
\examples{
get_location(c("Salamanca, Spain","New York, United States"))
}
