<div class="table table-striped">
    <table id="example" class="datatables-basic table border-top table-striped">
        <thead>
            <tr>
                <th style="text-align: left;border:1px solid #000">nama</th>
                <th style="text-align: left;border:1px solid #000">nik</th>
                <th style="text-align: left;border:1px solid #000">jenis_kelamin</th>
                <th style="text-align: left;border:1px solid #000">iq</th>
                <th style="text-align: left;border:1px solid #000">ipk</th>
                <th style="text-align: left;border:1px solid #000">company_shortname</th>
                <th style="text-align: left;border:1px solid #000">divisi</th>
                <th style="text-align: left;border:1px solid #000">departemen</th>
                <th style="text-align: left;border:1px solid #000">batch</th>
                <th style="text-align: left;border:1px solid #000">tahun</th>
            </tr>
        </thead>
        <tbody>
            @foreach($kaders as $kader)
            <tr>
                <td style="text-align: left;border:1px solid #000">{{$kader->nama}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->nik}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->jenis_kelamin}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->iq}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->ipk}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->bu}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->divisi_name}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->dept_name}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->batch_name}}</td>
                <td style="text-align: left;border:1px solid #000">{{$kader->tahun_batch}}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>