\name{World}
\alias{World}
\docType{data}
\title{
World country polygons
}
\description{
The object loaded is a sf object containing a world map data from Natural Earth with a few variables from World Bank.
}
\usage{data("World")}
\format{
  Formal class 'sf' [package "sf"]; the data contains a data.frame with 177 obs. of 11 variables:
  \describe{
    \item{\code{iso_a2}}{character vector of ISO 2 character country codes}
    \item{\code{name_long}}{character vector of country names}
    \item{\code{continent}}{character vector of continent names}
    \item{\code{region_un}}{character vector of region names}
    \item{\code{subregion}}{character vector of subregion names}
    \item{\code{type}}{character vector of type names}
    \item{\code{area_km2}}{integer vector of area values}
    \item{\code{pop}}{integer vector of population in 2014}
    \item{\code{lifeExp}}{integer vector of life expectancy at birth in 2014}
    \item{\code{gdpPercap}}{nteger vector of per-capita GDP in 2014}
    \item{\code{geom}}{sfc_MULTIPOLYGON}
  }
  The object is in geographical coordinates using the WGS84 datum
}
\source{
https://www.naturalearthdata.com/
https://data.worldbank.org/
}
\examples{
if (requireNamespace("sf", quietly = TRUE)) {
  library(sf)
  data(World)
  plot(World)
}
}
\keyword{datasets}
