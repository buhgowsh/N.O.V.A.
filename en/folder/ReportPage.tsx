import ImageAnalyzer from "@/components/api/ImageAnalyzer"
import Navbar from "@/components/ui/Navbar"
import ParticleComponent from "@/components/ui/Particles"

function ReportPage() {

    const apiKey = process.env.OPENAI_API_KEY || ''

    return (
        <div className="flex flex-col bg-white text-blue-900 min-h-screen w-full">

        {/*idk where this should be put*/}
        <div className="container mx-auto py-8">
        <ImageAnalyzer apiKey={apiKey} />
        </div>

            <Navbar />
            {/*Particles*/}
            <div className="absolute inset-0 z-0 blur-xs">
                <ParticleComponent />
            </div>
            <main className="flex flex-grow items-center justify-center px-4 z-20">
                <div id="Analysis" >
                    {/*Heading*/}
                    <h1 className="text-[5rem] text-center font-bold text-blue-800 font-theme tracking-wide mb-2 ">
                        Analysis
                    </h1>

                    {/*Graph*/}
                    <img src=""/>

                    {/*Text Report*/}
                    <p id="data" className="bg-gray-100 p-5">

                    </p>

                    {/* Table*/}
                    <table>
                        {/*Row1*/}
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        {/*Row2*/}
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        {/*Row3*/}
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        {/*Row4*/}
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </table>
                </div>
            </main>
        </div>
    )
}

export default ReportPage