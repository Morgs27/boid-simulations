import './Slider.css'
import SliderImport from 'react-input-slider';

type SliderProps = {
    value: number
    min: number
    max: number
    title: string
    setState: (data: any) => void
}


export function Slider({value, min, max , title, setState } : SliderProps){

    return(
        <>
        <div className="slider">
            <div className="sliderTitle">{title}</div>
                <SliderImport
                    styles = {{
                        track: {
                            width: 150,
                            height: 5,
                            background: '#558cf4'
                        },
                        active: {
                            background: '#558cf4'
                        },
                        thumb: {
                            width: 15,
                            height: 15,
                            background: '#558cf4'
                        }
                    }}
                    axis = "x"
                    xmax = {max}
                    xmin = {min}
                    x={value}
                    onChange={({x}) => setState(x)}
                />
            <div className="value">
                {value}
            </div>
        </div>
        </>
    )
}